import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length) return getApp();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      "Firebase Admin env vars missing — set NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.",
    );
  }
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

let cachedDb: Firestore | null = null;
export function getAdminFirestore(): Firestore {
  if (!cachedDb) cachedDb = getFirestore(getAdminApp());
  return cachedDb;
}

/**
 * Shared Admin Firestore handle. Lazy by design — a Proxy that only
 * initializes Firestore on first property access at RUNTIME, never at
 * import time. This keeps `next build` from initializing Firebase (and
 * crashing when build-time env vars are absent).
 *
 *   import { db } from "@/lib/firebase/admin";
 *   const snap = await db.collection("users").doc(uid).get();
 */
export const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    const real = getAdminFirestore();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  return getAdminAuth().verifyIdToken(idToken);
}

export type { DecodedIdToken };
