// api/stripe/webhook.js
//
// Stripe appelle CETTE route directement (pas le navigateur) une fois le
// paiement confirmé. On vérifie la signature pour être sûr que l'appel
// vient bien de Stripe, puis on crédite les jetons.
//
// IMPORTANT : Stripe peut renvoyer le même événement plusieurs fois (retries
// réseau). On note donc l'id de session déjà traité pour ne JAMAIS créditer
// deux fois le même achat.
import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";
import { readDocument, updateDocument, createDocument } from "../../src/server/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const siteConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src/server/config.json"), "utf-8")
);
const { packages } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src/server/stripe/packages.json"), "utf-8")
);

// Nécessaire pour Stripe : la vérification de signature a besoin du corps
// BRUT de la requête, pas du JSON déjà parsé par Vercel.
export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Signature Stripe invalide:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Les abonnements sont crédités via invoice.payment_succeeded (ça couvre
    // aussi bien le premier prélèvement que les renouvellements) : on évite
    // ici de créditer une deuxième fois le même mois.
    if (session.mode === "subscription") {
      res.status(200).json({ received: true });
      return;
    }

    const { uid, packageId } = session.metadata || {};
    const pack = packages.find((p) => p.id === packageId);

    if (!uid || !pack) {
      console.error("Session Stripe sans métadonnées valides:", session.id);
      res.status(200).json({ received: true }); // on accuse réception quand même, rien à rejouer
      return;
    }

    await creditJetonsOnce("stripeProcessedSessions", session.id, uid, pack);
  } else if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
      res.status(200).json({ received: true });
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId).catch(() => null);
    const { uid, packageId } = subscription?.metadata || {};
    const pack = packages.find((p) => p.id === packageId);

    if (!uid || !pack) {
      console.error("Abonnement Stripe sans métadonnées valides:", subscriptionId);
      res.status(200).json({ received: true });
      return;
    }

    // Un id de facture est unique par prélèvement (premier mois inclus), donc
    // ça sert aussi bien à cadencer les renouvellements qu'à éviter les doublons.
    await creditJetonsOnce("stripeProcessedInvoices", invoice.id, uid, pack);
  }

  res.status(200).json({ received: true });
}

async function creditJetonsOnce(ledgerCollection, ledgerId, uid, pack) {
  const alreadyProcessed = await readDocument(ledgerCollection, ledgerId).catch(() => null);
  if (alreadyProcessed) return;

  const account = (await readDocument(siteConfig.dbCollectionPlayer, uid).catch(() => null)) || siteConfig.plrNull;
  const totalJetons = pack.jetons + (pack.bonusJetons || 0);
  const newBalance = (account.jetons || 0) + totalJetons;

  await updateDocument(siteConfig.dbCollectionPlayer, uid, { jetons: newBalance });
  await createDocument(ledgerCollection, ledgerId, {
    uid,
    packageId: pack.id,
    jetons: totalJetons,
    processedAt: Date.now(),
  });
}