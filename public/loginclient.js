import { signInWithGoogle } from "../src/frontend/dbclient.js";
const localStorage = window.localStorage

function checkToken() {

}

if (localStorage.getItem('token')) {
  window.location.href = '/'

}

document.getElementsByClassName("google-btn")[0].addEventListener("click", async function() {
  const { user, idToken } = await signInWithGoogle();
  console.log("User signed in with Google:", user);
  localStorage.setItem('token', idToken);
  window.location.href = '/';
});