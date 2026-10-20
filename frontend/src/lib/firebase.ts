import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDQSHFtwIuqK8wRaejjG2Zi2Hli-SCjWW0",
  authDomain: "karmik-seek.firebaseapp.com",
  projectId: "karmik-seek",
  storageBucket: "karmik-seek.firebasestorage.app",
  messagingSenderId: "1028204968454",
  appId: "1:1028204968454:web:34d4f10df919f61806e187"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
  app,
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type FirebaseUser
};
