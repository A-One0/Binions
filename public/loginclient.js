<<<<<<< HEAD
import { signInWithGoogle } from "./dbclient.js";
=======
import { signInWithGoogle } from "/dbclient.js";
>>>>>>> 6fc40ff496e764405e78ee24d31df188746b96c7
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