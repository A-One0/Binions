// Représentation d'une carte : chaîne de 2 caractères "rang"+"couleur"
// ex: "As" = as de pique, "Td" = 10 de carreau, "2c" = 2 de trèfle
import { randomInt } from "node:crypto";

const SUITS = ["s", "h", "d", "c"]; // spade, heart, diamond, club
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

export function createDeck() {
  const deck = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

// Fisher-Yates avec crypto.randomInt (pas Math.random) : important dès
// qu'il y a des jetons en jeu, pour ne pas avoir un mélange prévisible/biaisé.
export function shuffle(deck) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function rankValue(card) {
  return RANKS.indexOf(card[0]) + 2; // 2..14 (14 = As)
}

export function suitOf(card) {
  return card[1];
}

export { RANKS, SUITS };
