// public/dbClient.js
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC9B405TkvTXdfkvtrK7n0z-fWuMtVI-zE",
  authDomain: "binions-2ec94.firebaseapp.com",
  databaseURL: "https://binions-2ec94-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "binions-2ec94",
  storageBucket: "binions-2ec94.firebasestorage.app",
  messagingSenderId: "974246345035",
  appId: "1:974246345035:web:75793a06b4f97ddb9d10ce",
  measurementId: "G-F935SLX99T"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let analytics = null;
analyticsIsSupported().then((supported) => {
  if (supported) analytics = getAnalytics(app);
});

function createUser(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

function signInUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
}

function signOutUser() {
  return signOut(auth);
}

function getCurrentIdToken() {
  return auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null);
}

export {
  app,
  auth,
  createUser,
  signInUser,
  signInWithGoogle,
  signOutUser,
  getCurrentIdToken,
};