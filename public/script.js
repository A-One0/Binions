const localStorage = window.localStorage;
/*
function getToken() {
    return localStorage.getItem("tokenConnexion");
};

if (getToken() === null) {
    window.location.href = "/login";
}
    */

// Navigation
const navLinks = document.querySelectorAll("nav a");
const sections = document.querySelectorAll("#pages > section");

function navigate() {
    const targetId = window.location.hash.substring(1);
    const pageId = targetId || "#";

    const targetSection = document.getElementById(pageId);
    const targetLink = document.querySelector(`nav a[href="#${pageId}"]`) || document.querySelector(`nav a[href="#"]`);

    if (!targetSection) {
        return;
    }

    sections.forEach(section => {
        section.style.display = "none";
    });
    navLinks.forEach(link => {
        link.classList.remove("select");
    });
    targetSection.style.display = "block";
    targetLink.classList.add("select");
}

window.addEventListener("hashchange", navigate);

navigate();
