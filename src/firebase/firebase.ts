// firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GithubAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth"; // Added Auth imports

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // Using environment variable
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // Using environment variable
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, // Using environment variable
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // Using environment variable
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Using environment variable
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // Using environment variable
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, // Using environment variable
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Using environment variable
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const auth = getAuth(app); // Initialize Firebase Auth
const githubProvider = new GithubAuthProvider(); // Create a GitHub Auth provider instance

// Function to sign in with GitHub
const signInWithGitHub = () => {
  return signInWithPopup(auth, githubProvider);
};

// Function to sign out
const signOutUser = () => {
  return signOut(auth);
};

export { app, db, auth, signInWithGitHub, signOutUser, onAuthStateChanged };
export type { FirebaseUser }; // Export FirebaseUser type
