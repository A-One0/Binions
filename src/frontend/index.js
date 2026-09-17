const localStorage = window.localStorage;

function getToken() {
    return localStorage.getItem("tokenConnexion");
};

if (getToken() === null) {
    window.location.href = "/login";
}