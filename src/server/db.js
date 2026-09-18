// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6DgCAyNNSjDkHRnvbl9-l-cmI9-ha9Yk",
  authDomain: "site-80.firebaseapp.com",
  databaseURL: "https://site-80-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "site-80",
  storageBucket: "site-80.firebasestorage.app",
  messagingSenderId: "832197308909",
  appId: "1:832197308909:web:02863bd3d9b1bc502737e4",
  measurementId: "G-2JKRNQGL2D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const db = getDatabase(app);
const auth = getAuth(app);
