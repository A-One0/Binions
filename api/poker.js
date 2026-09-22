// Route Vercel (format `export default function handler(req, res)`).
// Le client envoie son idToken Firebase à chaque appel ; on le vérifie
// côté serveur avec firebase-admin (comme le ferait getuserbytoken.js),
// on n'accepte donc jamais un uid envoyé "en clair" par le client.
import fs from "node:fs";
import path from "node:path";
import { verifyIdToken, readDocument } from "../src/server/db.js";
import {
  handleJoin,
  handleNextHand,
  handleGameAction,
  handleLeave,
} from "../src/server/poker/tableManager.js";

const config = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src/server/config.json"), "utf-8")
);

const GAME_ACTIONS = new Set(["fold", "check", "call", "bet", "raise", "allin"]);
const DEFAULT_BUY_IN = 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Méthode non autorisée" });
    return;
  }

  const { idToken, tableId, action, amount, stake, mode } = req.body || {};

  if (!idToken) {
    res.status(401).json({ error: "idToken manquant" });
    return;
  }
  if (!tableId) {
    res.status(400).json({ error: "tableId manquant" });
    return;
  }

  let decoded;
  try {
    decoded = await verifyIdToken(idToken);
  } catch (err) {
    res.status(401).json({ error: "Session invalide, reconnectez-vous" });
    return;
  }
  const uid = decoded.uid;

  try {
    let publicState;

    if (action === "join") {
      const account = await readDocument(config.dbCollectionPlayer, uid);
      const username =
        (account && (account.username || account.pseudo)) ||
        decoded.name ||
        decoded.email?.split("@")[0] ||
        "Joueur";
      // Le buy-in vient des jetons du joueur ; on plafonne pour éviter un
      // buy-in à 0 qui bloquerait la table (à ajuster selon vos règles de mise).
      const buyIn = account && account.jetons > 0 ? Math.min(account.jetons, 5000) : DEFAULT_BUY_IN;

      publicState = await handleJoin(tableId, uid, { username, stake, mode, buyIn });
    } else if (action === "next-hand") {
      publicState = await handleNextHand(tableId, uid);
    } else if (action === "leave") {
      publicState = await handleLeave(tableId, uid);
    } else if (GAME_ACTIONS.has(action)) {
      publicState = await handleGameAction(tableId, uid, action, Number(amount) || 0);
    } else {
      res.status(400).json({ error: "Action inconnue" });
      return;
    }

    res.status(200).json({ ok: true, state: publicState });
  } catch (err) {
    console.error("poker action error:", err);
    res.status(400).json({ error: err.message || "Erreur serveur" });
  }
}
