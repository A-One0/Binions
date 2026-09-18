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

// formulaire carte
const cardNumberInput = document.getElementById("card-number");
const cardExpirationInput = document.getElementById("card-exp");
const cardCvvInput = document.getElementById("card-cvv");

const cardVisualNumber = document.getElementById("card-visual-number");
const cardVisualBrand = document.getElementById("card-visual-brand");

const CARD_NUMBER_PLACEHOLDER = "•••• •••• •••• ••••";

// Détecte le type de carte à partir de ses premiers chiffres (règles IIN/BIN usuelles)
function detectCardBrand(digits) {
    if (/^4/.test(digits)) return "Visa";
    if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return "Mastercard";
    if (/^3[47]/.test(digits)) return "American Express";
    if (/^6(?:011|5)/.test(digits)) return "Discover";
    if (/^3(?:0[0-5]|[68])/.test(digits)) return "Diners Club";
    if (/^35/.test(digits)) return "JCB";
    return "";
}

// Construit l'affichage masqué : chiffres déjà saisis visibles, le reste en points
function buildMaskedNumber(digits) {
    if (digits.length === 0) return CARD_NUMBER_PLACEHOLDER;

    let display = "";
    for (let i = 0; i < 16; i++) {
        display += i < digits.length ? digits[i] : "•";
        if (i % 4 === 3 && i !== 15) display += " ";
    }
    return display;
}

function updateCardVisual() {
    const digits = cardNumberInput.value.replace(/\D/g, "").slice(0, 16);
    cardVisualNumber.textContent = buildMaskedNumber(digits);
    cardVisualBrand.textContent = detectCardBrand(digits);
}

cardNumberInput.addEventListener("input", () => {
    const digits = cardNumberInput.value.replace(/\D/g, "").slice(0, 16);
    cardNumberInput.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    updateCardVisual();
});

cardExpirationInput.addEventListener("input", () => {
    const digits = cardExpirationInput.value.replace(/\D/g, "").slice(0, 4);
    cardExpirationInput.value = digits.length >= 2
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : digits;
});

cardCvvInput.addEventListener("input", () => {
    cardCvvInput.value = cardCvvInput.value.replace(/\D/g, "").slice(0, 3);
});

function resetAllForms() {
    document.querySelectorAll("form").forEach(form => form.reset());
    updateCardVisual();
}

window.addEventListener("pageshow", resetAllForms);

const userIdCluster = document.querySelector(".user-id");
if (userIdCluster) {
    userIdCluster.addEventListener("click", () => {
        window.location.hash = "#Account";
    });
}