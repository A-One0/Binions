// src/server/poker/tableManager.js
//
// Fait le pont entre le moteur pur (pokerEngine.js) et Firebase (db.js).
// C'est ici qu'on lit/écrit la base : le moteur lui-même ne connaît pas Firebase.
//
// Trois zones dans la base pour une table donnée :
//   pokerTables/{tableId}/engine     -> état complet (deck, cartes privées). Règles: lecture/écriture refusées aux clients.
//   pokerTables/{tableId}/public     -> état sans les cartes privées ni le deck. Lecture: joueurs connectés.
//   pokerTables/{tableId}/holeCards/{uid} -> cartes privées d'UN joueur. Lecture: seulement ce joueur (auth.uid === $uid).
//
// Comme les fonctions Vercel sont sans état entre deux appels, TOUT est relu
// depuis "engine" à chaque requête, puis réécrit après application de l'action.
import {
  createTable,
  joinTable,
  startHand,
  applyAction,
  derivePublicState,
  deriveHoleCards,
  MAX_SEATS,
} from "./pokerEngine.js";
import { readDocument, createDocument, updateDocument } from "../db.js";

const ENGINE_COLLECTION = (tableId) => `pokerTables/${tableId}`;

async function readEngine(tableId) {
  return readDocument(ENGINE_COLLECTION(tableId), "engine");
}

async function persist(state, uid) {
  const tableId = state.tableId;
  await createDocument(ENGINE_COLLECTION(tableId), "engine", state);

  return {
    publicState: derivePublicState(state),
    holeCards: deriveHoleCards(state, uid),
  };
}

export async function handleJoin(tableId, uid, { username, stake, mode, buyIn }) {
  let state = await readEngine(tableId);
  if (!state) {
    state = createTable(tableId, { stake: stake || 25, mode: mode || "Cash Game" });
  }

  state = joinTable(state, { uid, username: username || "Joueur", buyIn: buyIn || 1000 });

  const seatedCount = state.seats.filter(Boolean).length;
  if (state.status === "waiting" && seatedCount >= 2) {
    state = startHand(state);
  }

  return persist(state, uid);
}

export async function handleState(tableId, uid) {
  const state = await readEngine(tableId);
  if (!state) throw new Error("Table introuvable");
  return { publicState: derivePublicState(state), holeCards: deriveHoleCards(state, uid) };
}

export async function handleNextHand(tableId, uid) {
  let state = await readEngine(tableId);
  if (!state) throw new Error("Table introuvable");
  if (!state.seats.some((s) => s && s.uid === uid)) throw new Error("Joueur pas à cette table");
  if (state.status === "playing") throw new Error("Une main est déjà en cours");

  state = startHand(state);
  return persist(state, uid);
}

export async function handleGameAction(tableId, uid, action, amount) {
  let state = await readEngine(tableId);
  if (!state) throw new Error("Table introuvable");

  state = applyAction(state, uid, action, amount);
  return persist(state, uid);
}

export async function handleLeave(tableId, uid) {
  let state = await readEngine(tableId);
  if (!state) return null;
  const seats = state.seats.map((s) => (s && s.uid === uid ? null : s));
  state = { ...state, seats };
  return persist(state, uid);
}

export { MAX_SEATS };