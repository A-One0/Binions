// public/boutique.js
import { auth, getCurrentIdToken } from "./dbclient.js";
import { onAuthStateChanged } from "firebase/auth";

const grid = document.getElementById("boutique-grid");
const messageEl = document.getElementById("boutique-message");

function showMessage(text) {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.hidden = false;
}

// Affiche un message de retour si on revient de Stripe (succès/annulation).
const params = new URLSearchParams(window.location.search);
if (params.get("boutique") === "success") {
  showMessage("Paiement confirmé — vos jetons seront crédités dans quelques secondes.");
} else if (params.get("boutique") === "cancel") {
  showMessage("Paiement annulé.");
}

function renderPackages(packages) {
  if (!grid) return;
  grid.innerHTML = "";
  packages.forEach((pack) => {
    const card = document.createElement("div");
    card.className = "panel boutique-card";
    card.innerHTML = `
      <div class="panel-head">
        <h2>${pack.label}</h2>
      </div>
      <p class="boutique-jetons">${pack.jetons.toLocaleString("fr-FR")} jetons</p>
      <p class="boutique-bonus">${
        pack.bonusJetons ? `+${pack.bonusJetons.toLocaleString("fr-FR")} bonus` : "\u00A0"
      }</p>
      <p class="boutique-price">${pack.priceDisplay}${pack.mode === "subscription" ? "<span class=\"boutique-interval\">/mois</span>" : ""}</p>
      <button type="button" class="save buy-btn" data-package="${pack.id}">${
        pack.mode === "subscription" ? "S'abonner" : "Acheter"
      }</button>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll(".buy-btn").forEach((btn) => {
    btn.addEventListener("click", () => buyPackage(btn.dataset.package, btn));
  });
}

async function buyPackage(packageId, button) {
  const idToken = await getCurrentIdToken();
  if (!idToken) {
    window.location.href = "login.html";
    return;
  }

  button.disabled = true;
  button.textContent = "Redirection...";

  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, packageId }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      showMessage(data.error || "Impossible de lancer le paiement.");
      button.disabled = false;
      button.textContent = "Acheter";
      return;
    }
    window.location.href = data.url; // vers la page de paiement hébergée par Stripe
  } catch (err) {
    console.error(err);
    showMessage("Erreur réseau, réessayez.");
    button.disabled = false;
    button.textContent = "Acheter";
  }
}

async function loadCatalog() {
  try {
    const res = await fetch("/api/stripe/catalog");
    const data = await res.json();
    renderPackages(data.packages || []);
  } catch (err) {
    console.error(err);
    showMessage("Impossible de charger la boutique pour le moment.");
  }
}

// Le catalogue s'affiche même avant connexion ; l'achat, lui, demande d'être connecté.
loadCatalog();

onAuthStateChanged(auth, () => {
  // Pas d'action nécessaire ici pour l'instant — buyPackage() vérifie l'état
  // de connexion au moment du clic.
});