import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const FALLBACK_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCU1WhK4aik8yajP5773aqdLMuWPhSq1q8",
  authDomain: "mumuclass-3d13d.firebaseapp.com",
  projectId: "mumuclass-3d13d",
  storageBucket: "mumuclass-3d13d.firebasestorage.app",
  messagingSenderId: "115631247456",
  appId: "1:115631247456:web:50624dd77b99dd505ff305"
};

function readEnv(name, fallback = "") {
  const value = process.env[name];
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || fallback;
}

const firebaseConfig = {
  apiKey: readEnv("NEXT_PUBLIC_FIREBASE_API_KEY", FALLBACK_FIREBASE_CONFIG.apiKey),
  authDomain: readEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", FALLBACK_FIREBASE_CONFIG.authDomain),
  projectId: readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", FALLBACK_FIREBASE_CONFIG.projectId),
  storageBucket: readEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", FALLBACK_FIREBASE_CONFIG.storageBucket),
  messagingSenderId: readEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", FALLBACK_FIREBASE_CONFIG.messagingSenderId),
  appId: readEnv("NEXT_PUBLIC_FIREBASE_APP_ID", FALLBACK_FIREBASE_CONFIG.appId)
};

let firebaseApp;

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase env vars are missing. Set NEXT_PUBLIC_FIREBASE_API_KEY / NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN / NEXT_PUBLIC_FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_APP_ID."
    );
  }

  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }

  return firebaseApp;
}

export function getFirebaseAuthClient() {
  return getAuth(getFirebaseApp());
}
