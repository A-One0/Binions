const localStorage = window.localStorage;

function getToken() {
    return localStorage.getItem("tokenConnexion");
};

if (getToken() === null) {
    window.location.href = "/login";
}

// Navigation
const navLinks = document.querySelectorAll("nav a");
const sections = document.querySelectorAll("section");

function navigateTo(targetId) {
    const targetSection = document.getElementById(targetId);

    if (!targetSection) {
        console.warn(`Section introuvable : ${targetId}`);
        return;
    }

    sections.forEach(section => {
        section.style.display = section === targetSection
            ? "block"
            : "none";
    });
}

navLinks.forEach(link => {
    link.addEventListener("click", event => {
        //event.preventDefault();
        const targetId = link.getAttribute("href").substring(1);
        navigateTo(targetId);
    });
});