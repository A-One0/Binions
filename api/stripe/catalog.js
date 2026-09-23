// api/stripe/catalog.js
//
// Renvoie la liste des offres pour l'affichage. Le client n'a jamais besoin
// de connaître le stripePriceId : il renvoie juste le packageId choisi, et
// c'est /api/stripe/checkout.js qui retrouve le prix côté serveur.
import fs from "node:fs";
import path from "node:path";

const { packages } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src/server/stripe/packages.json"), "utf-8")
);

export default async function handler(req, res) {
  const publicCatalog = packages.map(({ id, label, jetons, bonusJetons, priceDisplay, mode }) => ({
    id,
    label,
    jetons,
    bonusJetons: bonusJetons || 0,
    priceDisplay,
    mode: mode || "payment",
  }));
  res.status(200).json({ packages: publicCatalog });
}