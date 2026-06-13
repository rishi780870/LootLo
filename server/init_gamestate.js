// Run this ONCE to initialize gameState in Firebase
// Command: node init_gamestate.js

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function init() {
  const gameRef = db.collection("gameState").doc("current");
  const doc = await gameRef.get();

  if (!doc.exists) {
    await gameRef.set({
      period: 100089,
      startTime: Date.now(),
      result: 0,
    });
    console.log("✅ gameState/current created! Period: 100089");
  } else {
    console.log("⚠️ Already exists:", doc.data());
    // Force reset startTime so server picks it up
    await gameRef.update({ startTime: Date.now() });
    console.log("✅ startTime reset to now!");
  }

  process.exit(0);
}

init();