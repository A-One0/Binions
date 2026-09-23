import { signInWithGoogle } from "./dbclient.js";

const localStorage = window.localStorage;

const googleButton = document.querySelector(".google-btn");

googleButton?.addEventListener("click", async function(event) {
  event.preventDefault();
  const { user } = await signInWithGoogle();
  window.location.href = 'index.html';

  const response = await fetch("/api/loginwithgoogle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user }),
  });
  const data = await response.json();

  localStorage.setItem("userToken", data);

});