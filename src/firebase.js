import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/app-check";

// Web API key is public by design; access is guarded by App Check + Firestore rules.
const firebaseConfig = {
  apiKey: "AIzaSyADnOuL4SxQ2Kq_M8Hl3n6NofhCup_QR1c",
  // Own domain so Google sign-in shows az.partal.app; /__/auth/* is proxied to Firebase in vercel.json.
  // On localhost fall back to the Firebase domain (no proxy there).
  authDomain: location.hostname === "az.partal.app" ? "az.partal.app" : "partal-15efc.firebaseapp.com",
  projectId: "partal-15efc",
  storageBucket: "partal-15efc.firebasestorage.app",
  messagingSenderId: "1035150457420",
  appId: "1:1035150457420:web:d6a4b223487b4f0629d2e9",
};

firebase.initializeApp(firebaseConfig);

try {
  firebase.appCheck().activate(
    new firebase.appCheck.ReCaptchaV3Provider("6LcgA5EsAAAAALU19hxwlcOUlIfdXHaSOkZsuIvr"),
    true
  );
} catch (e) { console.warn("App Check init:", e); }

export const db = firebase.firestore();
export const auth = firebase.auth();
export const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
export const increment = n => firebase.firestore.FieldValue.increment(n);
export const RecaptchaVerifier = firebase.auth.RecaptchaVerifier;
export const GoogleAuthProvider = firebase.auth.GoogleAuthProvider;
