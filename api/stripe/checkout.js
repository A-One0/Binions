// api/stripe/checkout.js
//
// Le client envoie son idToken + l'id du pack choisi. On vérifie le token
// (comme pour /api/poker), on retrouve le prix côté serveur (jamais depuis
// le client, pour ne pas pouvoir être manipulé), et on crée une session de
// paiement hébergée par Stripe. Aucune donnée de carte ne transite par ici.
import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";
import { verifyIdToken } from "../../src/server/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const { packages } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src/server/stripe/packages.json"), "utf-8")
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Méthode non autorisée" });
    return;
  }

  const { idToken, packageId } = req.body || {};
  if (!idToken) {
    res.status(401).json({ error: "idToken manquant" });
    return;
  }

  let decoded;
  try {
    decoded = await verifyIdToken(idToken);
  } catch {
    res.status(401).json({ error: "Session invalide, reconnectez-vous" });
    return;
  }

  const pack = packages.find((p) => p.id === packageId);
  if (!pack) {
    res.status(400).json({ error: "Offre inconnue" });
    return;
  }

  try {
    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: pack.stripePriceId, quantity: 1 }],
      // On rattache l'achat au joueur ici : le webhook n'a besoin de rien
      // d'autre pour créditer le bon compte.
      metadata: { uid: decoded.uid, packageId: pack.id },
      success_url: `${origin}/index.html?boutique=success#Boutique`,
      cancel_url: `${origin}/index.html?boutique=cancel#Boutique`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("stripe checkout error:", err);
    res.status(500).json({ error: "Impossible de créer le paiement" });
  }
}
