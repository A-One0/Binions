const backLink = document.querySelector(".legal-back");
const source = new URLSearchParams(window.location.search).get("from");
const referrerPath = document.referrer ? new URL(document.referrer).pathname : "";
const origin = source === "home" || referrerPath.endsWith("/index.html") || referrerPath.endsWith("/")
    ? "index.html"
    : "createaccount.html";

if (backLink) {
    backLink.href = origin;
    backLink.textContent = origin === "index.html"
        ? "Revenir à l'accueil"
        : "Revenir à la création du compte";
    backLink.hidden = false;
}
