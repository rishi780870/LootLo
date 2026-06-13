import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnynppL3npASNuRtt_KvXNXTya8aNCIDo",
  authDomain: "lootlo-104a6.firebaseapp.com",
  projectId: "lootlo-104a6",
  storageBucket: "lootlo-104a6.firebasestorage.app",
  messagingSenderId: "287759779790",
  appId: "1:287759779790:web:5949840b5462fb14a2cd9f",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);