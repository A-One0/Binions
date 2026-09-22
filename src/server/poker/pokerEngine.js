// Moteur de Texas Hold'em pur (aucun accès réseau/DB ici). Toutes les
// fonctions prennent un état complet et en retournent un nouveau.
// L'état complet contient TOUT (deck, cartes privées) et ne doit jamais
// être exposé aux clients tel quel — voir derivePublicState / deriveHoleCards.
import { createDeck, shuffle } from "./deck.js";
import { evaluate7, compareHandValues } from "./handEvaluator.js";

const MAX_SEATS = 4; // correspond aux 4 sièges de l'interface (haut/droite/bas/gauche)

export function createTable(tableId, { stake = 25, mode = "Cash Game" } = {}) {
  return {
    tableId,
    mode,
    stake, // grosse blinde ; petite blinde = stake / 2 (arrondi)
    status: "waiting", // waiting | playing | showdown
    phase: null, // preflop | flop | turn | river | showdown
    seats: new Array(MAX_SEATS).fill(null),
    dealerSeat: null,
    currentSeat: null,
    deck: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    minRaise: stake,
    handNumber: 0,
    lastHandResult: null,
  };
}

function emptySeatIndex(seats) {
  return seats.findIndex((s) => s === null);
}

export function joinTable(state, { uid, username, buyIn }) {
  if (state.seats.some((s) => s && s.uid === uid)) {
    return state; // déjà assis
  }
  const idx = emptySeatIndex(state.seats);
  if (idx === -1) throw new Error("Table complète");

  const seats = state.seats.slice();
  seats[idx] = {
    uid,
    username,
    seatIndex: idx,
    stack: buyIn,
    bet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    hasActed: false,
    holeCards: [],
    sittingOut: false,
  };
  return { ...state, seats };
}

export function leaveTable(state, uid) {
  const seats = state.seats.map((s) => (s && s.uid === uid ? null : s));
  return { ...state, seats };
}

function filledIndices(seats) {
  return seats.map((s, i) => (s ? i : null)).filter((i) => i !== null);
}

function nextFilledSeat(seats, fromIndex) {
  const filled = filledIndices(seats);
  if (filled.length === 0) return null;
  let i = (fromIndex + 1) % seats.length;
  while (!seats[i]) i = (i + 1) % seats.length;
  return i;
}

function nextActiveSeat(seats, fromIndex) {
  const filled = filledIndices(seats);
  if (filled.length === 0) return null;
  let i = (fromIndex + 1) % seats.length;
  let loops = 0;
  while (loops <= seats.length) {
    const s = seats[i];
    if (s && !s.folded && !s.allIn) return i;
    i = (i + 1) % seats.length;
    loops++;
  }
  return null; // personne ne peut plus agir (tous all-in / couchés)
}

function activePlayers(seats) {
  return seats.filter((s) => s && !s.folded);
}

function canAct(seats) {
  return seats.filter((s) => s && !s.folded && !s.allIn).length > 1;
}

// Démarre une nouvelle main : mélange, distribue, poste les blindes.
export function startHand(state) {
  const seatedCount = state.seats.filter((s) => s && s.stack > 0).length;
  if (seatedCount < 2) throw new Error("Il faut au moins 2 joueurs avec des jetons");

  let seats = state.seats.map((s) =>
    s
      ? {
          ...s,
          bet: 0,
          totalBet: 0,
          folded: s.stack <= 0, // un joueur sans jetons est spectateur ce coup-ci
          allIn: false,
          hasActed: false,
          holeCards: [],
        }
      : null
  );

  const dealerSeat =
    state.dealerSeat === null ? filledIndices(seats)[0] : nextFilledSeat(seats, state.dealerSeat);

  let deck = shuffle(createDeck());

  // distribution : 2 cartes chacun, dans l'ordre à partir de la petite blinde
  const order = [];
  let cursor = dealerSeat;
  for (let n = 0; n < filledIndices(seats).length; n++) {
    cursor = n === 0 ? dealerSeat : nextFilledSeat(seats, cursor);
    order.push(cursor);
  }
  for (let round = 0; round < 2; round++) {
    for (const idx of order) {
      seats[idx] = { ...seats[idx], holeCards: [...seats[idx].holeCards, deck.pop()] };
    }
  }

  const smallBlind = Math.max(1, Math.floor(state.stake / 2));
  const bigBlind = state.stake;

  const headsUp = filledIndices(seats).length === 2;
  // Heads-up : le donneur poste la petite blinde et parle en premier préflop.
  const sbSeat = headsUp ? dealerSeat : nextFilledSeat(seats, dealerSeat);
  const bbSeat = nextFilledSeat(seats, sbSeat);

  seats = postBlind(seats, sbSeat, smallBlind);
  seats = postBlind(seats, bbSeat, bigBlind);

  const firstToAct = headsUp ? sbSeat : nextActiveSeat(seats, bbSeat);

  return {
    ...state,
    status: "playing",
    phase: "preflop",
    seats,
    deck,
    communityCards: [],
    dealerSeat,
    currentSeat: firstToAct,
    currentBet: bigBlind,
    minRaise: bigBlind,
    pot: 0,
    handNumber: state.handNumber + 1,
    lastHandResult: null,
  };
}

function postBlind(seats, seatIndex, amount) {
  const seats2 = seats.slice();
  const s = seats2[seatIndex];
  const paid = Math.min(amount, s.stack);
  seats2[seatIndex] = {
    ...s,
    stack: s.stack - paid,
    bet: paid,
    totalBet: paid,
    allIn: s.stack - paid === 0,
  };
  return seats2;
}

// Applique une action d'un joueur : fold | check | call | bet | raise | allin
// `amount` pour bet/raise = la mise TOTALE souhaitée sur cette rue (pas juste l'ajout).
export function applyAction(state, uid, action, amount = 0) {
  if (state.status !== "playing") throw new Error("Aucune main en cours");
  const seatIndex = state.seats.findIndex((s) => s && s.uid === uid);
  if (seatIndex === -1) throw new Error("Joueur pas à cette table");
  if (state.currentSeat !== seatIndex) throw new Error("Ce n'est pas votre tour");

  let seats = state.seats.slice();
  const seat = { ...seats[seatIndex] };
  const toCall = state.currentBet - seat.bet;
  let currentBet = state.currentBet;
  let minRaise = state.minRaise;
  let reopenBetting = false;

  switch (action) {
    case "fold": {
      seat.folded = true;
      seat.hasActed = true;
      break;
    }
    case "check": {
      if (toCall > 0) throw new Error("Impossible de checker, il faut suivre ou se coucher");
      seat.hasActed = true;
      break;
    }
    case "call": {
      const pay = Math.min(toCall, seat.stack);
      seat.stack -= pay;
      seat.bet += pay;
      seat.totalBet += pay;
      seat.allIn = seat.stack === 0;
      seat.hasActed = true;
      break;
    }
    case "bet":
    case "raise": {
      if (amount <= currentBet) throw new Error("Le montant doit dépasser la mise actuelle");
      const raiseSize = amount - currentBet;
      if (raiseSize < minRaise && amount < seat.bet + seat.stack) {
        throw new Error(`Relance minimum : ${currentBet + minRaise}`);
      }
      const pay = amount - seat.bet;
      if (pay > seat.stack) throw new Error("Jetons insuffisants");
      seat.stack -= pay;
      seat.bet = amount;
      seat.totalBet += pay;
      seat.allIn = seat.stack === 0;
      minRaise = Math.max(minRaise, raiseSize);
      currentBet = amount;
      seat.hasActed = true;
      reopenBetting = true;
      break;
    }
    case "allin": {
      const pay = seat.stack;
      const newBet = seat.bet + pay;
      seat.stack = 0;
      seat.bet = newBet;
      seat.totalBet += pay;
      seat.allIn = true;
      seat.hasActed = true;
      if (newBet > currentBet) {
        minRaise = Math.max(minRaise, newBet - currentBet);
        currentBet = newBet;
        reopenBetting = true; // un all-in qui relance rouvre les enchères
      }
      break;
    }
    default:
      throw new Error("Action inconnue");
  }

  seats[seatIndex] = seat;

  if (reopenBetting) {
    seats = seats.map((s, i) =>
      s && i !== seatIndex && !s.folded && !s.allIn ? { ...s, hasActed: false } : s
    );
  }

  let newState = { ...state, seats, currentBet, minRaise };

  // Un seul joueur non couché restant -> il remporte le pot immédiatement.
  const remaining = activePlayers(seats);
  if (remaining.length === 1) {
    return awardUncontested(newState, remaining[0].uid);
  }

  // Fin de la rue d'enchères ?
  const activeToAct = seats.filter((s) => s && !s.folded && !s.allIn);
  const roundDone =
    activeToAct.length === 0 ||
    activeToAct.every((s) => s.hasActed && s.bet === currentBet);

  if (!roundDone) {
    newState.currentSeat = nextActiveSeat(seats, seatIndex);
    return newState;
  }

  return advanceStreet(newState);
}

function collectBetsIntoPot(state) {
  const seats = state.seats.map((s) => (s ? { ...s, bet: 0 } : null));
  const pot = state.pot + state.seats.reduce((sum, s) => sum + (s ? s.bet : 0), 0);
  return { ...state, seats, pot };
}

function advanceStreet(state) {
  let newState = collectBetsIntoPot(state);
  let deck = newState.deck.slice();
  let communityCards = newState.communityCards.slice();

  const everyoneAllInOrFolded = !canAct(newState.seats);

  if (newState.phase === "preflop") {
    deck.pop(); // brûlage
    communityCards.push(deck.pop(), deck.pop(), deck.pop());
    newState = { ...newState, phase: "flop", deck, communityCards, currentBet: 0, minRaise: newState.stake };
  } else if (newState.phase === "flop") {
    deck.pop();
    communityCards.push(deck.pop());
    newState = { ...newState, phase: "turn", deck, communityCards, currentBet: 0, minRaise: newState.stake };
  } else if (newState.phase === "turn") {
    deck.pop();
    communityCards.push(deck.pop());
    newState = { ...newState, phase: "river", deck, communityCards, currentBet: 0, minRaise: newState.stake };
  } else {
    return resolveShowdown(newState);
  }

  newState.seats = newState.seats.map((s) => (s && !s.folded ? { ...s, hasActed: false } : s));

  if (everyoneAllInOrFolded) {
    // Personne ne peut plus miser : on distribue les cartes restantes d'un coup.
    return advanceStreet(newState);
  }

  newState.currentSeat = nextActiveSeat(newState.seats, newState.dealerSeat);
  return newState;
}

function awardUncontested(state, winnerUid) {
  const collected = collectBetsIntoPot(state);
  const seats = collected.seats.map((s) =>
    s && s.uid === winnerUid ? { ...s, stack: s.stack + collected.pot } : s
  );
  return {
    ...collected,
    seats,
    pot: 0,
    status: "waiting",
    phase: "showdown",
    currentSeat: null,
    lastHandResult: {
      type: "uncontested",
      winners: [{ uid: winnerUid, amount: collected.pot }],
    },
  };
}

// Construit les pots (principal + side-pots) à partir des mises totales de la main.
function buildPots(seats) {
  const contributors = seats
    .map((s, i) => (s ? { index: i, totalBet: s.totalBet, folded: s.folded } : null))
    .filter((c) => c && c.totalBet > 0);

  const thresholds = [...new Set(contributors.map((c) => c.totalBet))].sort((a, b) => a - b);

  const pots = [];
  let previous = 0;
  for (const threshold of thresholds) {
    const layerContributors = contributors.filter((c) => c.totalBet >= threshold);
    const amount = (threshold - previous) * layerContributors.length;
    const eligible = layerContributors.filter((c) => !c.folded).map((c) => c.index);
    if (amount > 0 && eligible.length > 0) pots.push({ amount, eligible });
    previous = threshold;
  }
  return pots;
}

function resolveShowdown(state) {
  const collected = collectBetsIntoPot(state);
  const seats = collected.seats.slice();
  const pots = buildPots(seats);

  const handValues = {};
  for (const idx of filledIndices(seats)) {
    const s = seats[idx];
    if (s.folded) continue;
    handValues[idx] = evaluate7([...s.holeCards, ...collected.communityCards]);
  }

  const winnersByPot = [];
  for (const pot of pots) {
    let best = null;
    let bestSeats = [];
    for (const idx of pot.eligible) {
      const val = handValues[idx];
      const cmp = best === null ? 1 : compareHandValues(val, best);
      if (cmp > 0) {
        best = val;
        bestSeats = [idx];
      } else if (cmp === 0) {
        bestSeats.push(idx);
      }
    }
    const share = Math.floor(pot.amount / bestSeats.length);
    let remainder = pot.amount - share * bestSeats.length;
    for (const idx of bestSeats) {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      seats[idx] = { ...seats[idx], stack: seats[idx].stack + share + extra };
    }
    winnersByPot.push({
      amount: pot.amount,
      winners: bestSeats.map((idx) => ({ uid: seats[idx].uid, seatIndex: idx })),
    });
  }

  return {
    ...collected,
    seats,
    pot: 0,
    status: "waiting",
    phase: "showdown",
    currentSeat: null,
    lastHandResult: {
      type: "showdown",
      pots: winnersByPot,
      reveals: filledIndices(seats)
        .filter((i) => !seats[i].folded)
        .map((i) => ({ seatIndex: i, uid: seats[i].uid, holeCards: seats[i].holeCards })),
    },
  };
}

// ---- Vues dérivées, sûres à envoyer aux clients ----

export function derivePublicState(state) {
  return {
    tableId: state.tableId,
    mode: state.mode,
    stake: state.stake,
    status: state.status,
    phase: state.phase,
    dealerSeat: state.dealerSeat,
    currentSeat: state.currentSeat,
    communityCards: state.communityCards,
    pot: state.pot + state.seats.reduce((sum, s) => sum + (s ? s.bet : 0), 0),
    currentBet: state.currentBet,
    minRaise: state.minRaise,
    handNumber: state.handNumber,
    lastHandResult: state.lastHandResult,
    seats: state.seats.map((s) =>
      s
        ? {
            uid: s.uid,
            username: s.username,
            seatIndex: s.seatIndex,
            stack: s.stack,
            bet: s.bet,
            folded: s.folded,
            allIn: s.allIn,
            hasCards: s.holeCards.length > 0 && !s.folded,
          }
        : null
    ),
  };
}

export function deriveHoleCards(state, uid) {
  const seat = state.seats.find((s) => s && s.uid === uid);
  return seat ? seat.holeCards : [];
}

export { MAX_SEATS };
