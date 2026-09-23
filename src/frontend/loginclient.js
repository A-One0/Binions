import { signInWithGoogle } from "./dbclient.js";

const localStorage = window.localStorage;

if (localStorage.getItem("token")) {
  window.location.href = "index.html";
}

const googleButton = document.querySelector(".google-btn");

googleButton?.addEventListener("click", async event => {
  event.preventDefault();
  googleButton.setAttribute("aria-busy", "true");

  try {
    const { user, idToken } = await signInWithGoogle();
    console.log("User signed in with Google:", user);
    localStorage.setItem("token", idToken);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Google sign-in failed:", error);
    googleButton.removeAttribute("aria-busy");
  }
});
