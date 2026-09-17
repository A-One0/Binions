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

navLinks.forEach(link => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        const targetId = link.getAttribute("href").substring(1);
        const targetSection = document.getElementById(targetId);
        targetSection.style.display = "block";

        console.log(`Navigating to section: ${targetId}`);
        
        sections.forEach(section => {
            if (section !== targetSection) {
                section.style.display = "none";
            }
        });
    });
});