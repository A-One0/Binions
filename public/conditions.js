// public/conditions.js
const backLink = document.querySelector(".legal-back");

function resolveOrigin() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("from") === "home") return "index.html";
  
  try {
    if (document.referrer) {
      const referrerPath = new URL(document.referrer).pathname;
      if (referrerPath.endsWith("/index.html") || referrerPath.endsWith("/")) {
        return "index.html";
      }
      if (referrerPath.endsWith("/createaccount.html")) {
        return "createaccount.html";
      }
    }
  } catch (err) {
    console.warn("Referrer illisible, repli sur la valeur par défaut :", err);
  }

  return "createaccount.html";
}

if (backLink) {
  const origin = resolveOrigin();
  backLink.href = origin;
  backLink.textContent =
    origin === "index.html" ? "Revenir à l'accueil" : "Revenir à la création du compte";
  backLink.hidden = false;
}