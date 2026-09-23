
import { signInWithGoogle } from "./dbclient.js";

const localStorage = window.localStorage

function checkToken() {

}

if (localStorage.getItem('token')) {
  window.location.href = 'index.html';

}

const googleButton = document.querySelector(".google-btn");

googleButton?.addEventListener("click", async function(event) {
  event.preventDefault();
  const { user, idToken } = await signInWithGoogle();
  console.log("User signed in with Google:", user);
  localStorage.setItem('token', idToken);
  window.location.href = 'index.html';
});