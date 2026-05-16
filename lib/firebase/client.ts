"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  if (!firebaseConfig.apiKey) {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_API_KEY is missing — add Firebase env vars to .env.local",
    );
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const firebaseApp = typeof window !== "undefined" ? getFirebaseApp() : null;

export const firebaseAuth =
  typeof window !== "undefined" && firebaseApp ? getAuth(firebaseApp) : null;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

if (firebaseAuth) {
  void setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {
    // Persistence falls back to in-memory in private-browsing / SSR — non-fatal.
  });
}
