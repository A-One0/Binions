import admin from "firebase-admin";

console.log("FIREBASE_SERVICE_ACCOUNT:", process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
    databaseURL: "https://site-80-default-rtdb.europe-west1.firebasedatabase.app"
  });
}

const db = admin.database();
const auth = admin.auth();

function verifyIdToken(idToken) {
  return auth.verifyIdToken(idToken);
}

function createUser(email, password) {
  return auth.createUser({ email, password });
}

function getUser(uid) {
  return auth.getUser(uid);
}

function deleteUser(uid) {
  return auth.deleteUser(uid);
}

// --- Realtime Database : collections ---

function createCollection(collectionName, data) {
  return db.ref(collectionName).set(data);
}

function readCollection(collectionName) {
  return db.ref(collectionName).once("value").then(snap => snap.val());
}

function updateCollection(collectionName, data) {
  return db.ref(collectionName).update(data);
}

function deleteCollection(collectionName) {
  return db.ref(collectionName).remove();
}

// --- Realtime Database : documents ---

function createDocument(collectionName, documentId, data) {
  return db.ref(`${collectionName}/${documentId}`).set(data);
}

function readDocument(collectionName, documentId) {
  return db.ref(`${collectionName}/${documentId}`).once("value").then(snap => snap.val());
}

function updateDocument(collectionName, documentId, data) {
  return db.ref(`${collectionName}/${documentId}`).update(data);
}

function deleteDocument(collectionName, documentId) {
  return db.ref(`${collectionName}/${documentId}`).remove();
}

export {
  verifyIdToken,
  createUser,
  getUser,
  deleteUser,
  createCollection,
  readCollection,
  updateCollection,
  deleteCollection,
  createDocument,
  readDocument,
  updateDocument,
  deleteDocument
};