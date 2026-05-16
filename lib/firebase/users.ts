import "server-only";

import {
  getFirestore,
  FieldValue,
  type Firestore,
  type Timestamp,
} from "firebase-admin/firestore";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";

function getAdminApp() {
  if (getApps().length) return getApp();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error("Firebase Admin env vars missing.");
  }
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
    }),
  });
}

let cachedDb: Firestore | null = null;
function db(): Firestore {
  if (!cachedDb) cachedDb = getFirestore(getAdminApp());
  return cachedDb;
}

export interface UserProfileSnapshot {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  creditsBalance: number;
  signInProvider: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  lastSignInAt: Timestamp | null;
}

interface EnsureUserInput {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  signInProvider?: string | null;
}

export async function ensureUserDocument(
  input: EnsureUserInput,
): Promise<UserProfileSnapshot> {
  const ref = db().collection("users").doc(input.uid);
  const snap = await ref.get();
  const now = FieldValue.serverTimestamp();

  if (!snap.exists) {
    await ref.set({
      uid: input.uid,
      email: input.email,
      displayName: input.displayName ?? null,
      photoURL: input.photoURL ?? null,
      creditsBalance: 0,
      signInProvider: input.signInProvider ?? null,
      createdAt: now,
      updatedAt: now,
      lastSignInAt: now,
    });
  } else {
    await ref.set(
      {
        email: input.email,
        displayName: input.displayName ?? null,
        photoURL: input.photoURL ?? null,
        signInProvider: input.signInProvider ?? null,
        updatedAt: now,
        lastSignInAt: now,
      },
      { merge: true },
    );
  }

  const after = await ref.get();
  const data = after.data() ?? {};
  return {
    uid: input.uid,
    email: (data.email as string | null) ?? null,
    displayName: (data.displayName as string | null) ?? null,
    photoURL: (data.photoURL as string | null) ?? null,
    creditsBalance: (data.creditsBalance as number | undefined) ?? 0,
    signInProvider: (data.signInProvider as string | null) ?? null,
    createdAt: (data.createdAt as Timestamp | undefined) ?? null,
    updatedAt: (data.updatedAt as Timestamp | undefined) ?? null,
    lastSignInAt: (data.lastSignInAt as Timestamp | undefined) ?? null,
  };
}
