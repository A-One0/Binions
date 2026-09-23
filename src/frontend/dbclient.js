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
  apiKey: "AIzaSyA6DgCAyNNSjDkHRnvbl9-l-cmI9-ha9Yk",
  authDomain: "site-80.firebaseapp.com",
  databaseURL: "https://site-80-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "site-80",
  storageBucket: "site-80.firebasestorage.app",
  messagingSenderId: "832197308909",
  appId: "1:832197308909:web:02863bd3d9b1bc502737e4",
  measurementId: "G-2JKRNQGL2D",
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