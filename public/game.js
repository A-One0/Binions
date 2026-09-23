import { database, auth, getCurrentIdToken } from "./dbclient.js";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") || "Cash Game";
const stake = Number(params.get("stake")) || 25;

// --- Identifiant de table : on en réutilise un existant (lien d'invitation)
// ou on en crée un nouveau et on le pousse dans l'URL pour que le
// rafraîchissement de la page rejoigne la même table, pas une nouvelle.
function generateTableId() {
  return `BIN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

let tableId = params.get("table");
if (!tableId) {
  tableId = generateTableId();
  const url = new URL(window.location.href);
  url.searchParams.set("table", tableId);
  url.searchParams.set("mode", mode);
  url.searchParams.set("stake", String(stake));
  window.history.replaceState({}, "", url);
}

const roomCode = document.getElementById("room-code");
const copyRoomCode = document.getElementById("copy-room-code");
const gameModeEl = document.getElementById("game-mode");
const gameStakesEl = document.getElementById("game-stakes");

roomCode.textContent = tableId;
gameModeEl.textContent = mode;
gameStakesEl.textContent = `Blindes ${stake}`;

copyRoomCode.addEventListener("click", async () => {
  const link = window.location.href;
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(roomCode);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  copyRoomCode.textContent = "Lien copié";
  window.setTimeout(() => {
    copyRoomCode.textContent = "Copier le code";
  }, 1600);
});

// --- Appel de l'API serveur (source unique de vérité pour toute action) ---
async function callPoker(action, extra = {}) {
  const idToken = await getCurrentIdToken();
  if (!idToken) {
    window.location.href = "login.html";
    return null;
  }
  const res = await fetch("/api/poker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, tableId, action, ...extra }),
  });
  const data = await res.json();
  if (!res.ok) {
    showError(data.error || "Erreur");
    return null;
  }
  if (data.holeCards) myHoleCards = data.holeCards;
  return data.publicState;
}

function showError(message) {
  const el = document.getElementById("game-error");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  window.setTimeout(() => {
    el.hidden = true;
  }, 3000);
}

// --- Rendu de l'état public de la table ---
let myUid = null;
let myHoleCards = [];
let latestPublicState = null;

function cardLabel(card) {
  if (!card) return "";
  const rank = card[0];
  const suitSymbols = { s: "♠", h: "♥", d: "♦", c: "♣" };
  return `${rank}${suitSymbols[card[1]] || card[1]}`;
}

function renderCard(card, faceDown = false) {
  const div = document.createElement("div");
  div.className = "playing-card" + (faceDown ? " face-down" : "");
  if (!faceDown && card) {
    const isRed = card[1] === "h" || card[1] === "d";
    div.classList.add(isRed ? "red" : "black");
    div.textContent = cardLabel(card);
  }
  return div;
}

const SEAT_ELS = {
  0: document.querySelector(".seat-top"),
  1: document.querySelector(".seat-right"),
  2: document.querySelector(".seat-bottom"),
  3: document.querySelector(".seat-left"),
};

function renderState(state) {
  latestPublicState = state;

  document.getElementById("game-mode").textContent = state.mode;
  document.getElementById("game-stakes").textContent = `Blindes ${state.stake}`;

  const centerStatus = document.querySelector(".table-center > span:last-child");
  if (centerStatus) {
    if (state.status === "waiting" && state.seats.filter(Boolean).length < 2) {
      centerStatus.textContent = "La partie démarre à 2 joueurs";
    } else if (state.status === "waiting") {
      centerStatus.textContent = "Main terminée — prêt pour la suivante";
    } else {
      centerStatus.textContent = { preflop: "Pré-flop", flop: "Flop", turn: "Turn", river: "River" }[
        state.phase
      ] || "";
    }
  }

  // Sièges
  state.seats.forEach((seat, idx) => {
    const el = SEAT_ELS[idx];
    if (!el) return;
    el.classList.toggle("occupied", Boolean(seat));
    el.classList.toggle("folded", Boolean(seat && seat.folded));
    el.classList.toggle("turn", state.currentSeat === idx);

    const avatar = el.querySelector(".seat-avatar");
    let label = el.querySelector(".seat-label");
    if (!label) {
      label = document.createElement("span");
      label.className = "seat-label";
      el.appendChild(label);
    }
    let cardsRow = el.querySelector(".seat-cards");
    if (!cardsRow) {
      cardsRow = document.createElement("div");
      cardsRow.className = "seat-cards";
      el.appendChild(cardsRow);
    }
    cardsRow.innerHTML = "";

    if (!seat) {
      avatar.textContent = "";
      label.textContent = "En attente";
      return;
    }

    avatar.textContent = seat.username.charAt(0).toUpperCase();
    label.textContent = `${seat.username} — ${seat.stack} jetons${seat.bet ? ` (mise ${seat.bet})` : ""}`;

    if (seat.hasCards) {
      if (seat.uid === myUid && myHoleCards.length === 2) {
        cardsRow.appendChild(renderCard(myHoleCards[0]));
        cardsRow.appendChild(renderCard(myHoleCards[1]));
      } else {
        cardsRow.appendChild(renderCard(null, true));
        cardsRow.appendChild(renderCard(null, true));
      }
    }

    // Révélation en fin de main
    if (state.lastHandResult && state.lastHandResult.type === "showdown") {
      const reveal = state.lastHandResult.reveals.find((r) => r.seatIndex === idx);
      if (reveal) {
        cardsRow.innerHTML = "";
        cardsRow.appendChild(renderCard(reveal.holeCards[0]));
        cardsRow.appendChild(renderCard(reveal.holeCards[1]));
      }
    }
  });

  // Cartes communes + pot
  let communityRow = document.getElementById("community-cards");
  communityRow.innerHTML = "";
  state.communityCards.forEach((c) => communityRow.appendChild(renderCard(c)));

  document.getElementById("pot-amount").textContent = `Pot : ${state.pot}`;

  // Barre d'actions
  renderActionBar(state);
}

function renderActionBar(state) {
  const bar = document.getElementById("action-bar");
  const nextHandBtn = document.getElementById("next-hand-btn");
  bar.hidden = true;
  nextHandBtn.hidden = true;

  if (!myUid) return;

  const mySeat = state.seats.find((s) => s && s.uid === myUid);
  if (!mySeat) return;

  if (state.status === "waiting") {
    nextHandBtn.hidden = false;
    return;
  }

  if (state.currentSeat === null) return;
  const currentSeat = state.seats[state.currentSeat];
  if (!currentSeat || currentSeat.uid !== myUid) return;

  bar.hidden = false;
  const toCall = state.currentBet - mySeat.bet;
  document.getElementById("call-btn").textContent = toCall > 0 ? `Suivre (${toCall})` : "Check";
  document.getElementById("call-btn").dataset.action = toCall > 0 ? "call" : "check";

  const raiseInput = document.getElementById("raise-input");
  raiseInput.min = state.currentBet + state.minRaise;
  raiseInput.max = mySeat.stack + mySeat.bet;
  if (!raiseInput.value || Number(raiseInput.value) < Number(raiseInput.min)) {
    raiseInput.value = raiseInput.min;
  }
}

document.getElementById("fold-btn")?.addEventListener("click", () => callPoker("fold"));
document.getElementById("call-btn")?.addEventListener("click", (e) => {
  callPoker(e.currentTarget.dataset.action);
});
document.getElementById("raise-btn")?.addEventListener("click", () => {
  const amount = Number(document.getElementById("raise-input").value);
  const state = latestPublicState;
  const mySeat = state?.seats.find((s) => s && s.uid === myUid);
  const isFirstBet = state && state.currentBet === 0;
  callPoker(isFirstBet ? "bet" : "raise", { amount });
});
document.getElementById("allin-btn")?.addEventListener("click", () => callPoker("allin"));
document.getElementById("next-hand-btn")?.addEventListener("click", () => callPoker("next-hand"));

// --- Démarrage : auth -> join -> écoute temps réel ---
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  myUid = user.uid;

  const state = await callPoker("join", { stake, mode });
  if (state) renderState(state);

  startPolling();
});

document.addEventListener("visibilitychange", () => {
  // On évite d'interroger le serveur pour rien quand l'onglet est en arrière-plan.
  if (document.hidden && pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  } else if (!document.hidden && myUid) {
    startPolling();
  }
});
*/

window.addEventListener("beforeunload", () => {
  // best effort ; sendBeacon ne peut pas facilement porter du JSON+idToken async ici,
  // donc on laisse le joueur assis (il pourra revenir avec le même lien).
});