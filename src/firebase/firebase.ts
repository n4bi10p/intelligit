// firebase.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD3IF0I3cAzVDKIjK8kdJJOUij_CrTt0ts",
  authDomain: "intelligit-chat.firebaseapp.com",
  databaseURL: "https://intelligit-chat-default-rtdb.firebaseio.com",
  projectId: "intelligit-chat",
  storageBucket: "intelligit-chat.appspot.com", // ✅ fixed
  messagingSenderId: "759084302913",
  appId: "1:759084302913:web:3b219b06a917c7625fbcc0",
  measurementId: "G-Q85LMDZ1CF",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { app, db };
