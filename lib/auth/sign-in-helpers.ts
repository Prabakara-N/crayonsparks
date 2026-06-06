"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  verifyPasswordResetCode,
  confirmPasswordReset,
  type User,
} from "firebase/auth";
import { firebaseAuth, googleProvider } from "@/lib/firebase/client";

function ensureAuth() {
  if (!firebaseAuth) {
    throw new Error(
      "Firebase Auth is not initialized — check NEXT_PUBLIC_FIREBASE_* env vars.",
    );
  }
  return firebaseAuth;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const auth = ensureAuth();
  const result = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  return result.user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const auth = ensureAuth();
  const result = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  return result.user;
}

export async function signInWithGoogle(): Promise<User> {
  const auth = ensureAuth();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "auth/popup-blocked"
    ) {
      await signInWithRedirect(auth, googleProvider);
      throw err;
    }
    throw err;
  }
}

export async function signOut(): Promise<void> {
  const auth = ensureAuth();
  await firebaseSignOut(auth);
}

export async function verifyResetCode(oobCode: string): Promise<string> {
  const auth = ensureAuth();
  return verifyPasswordResetCode(auth, oobCode);
}

export async function confirmReset(
  oobCode: string,
  newPassword: string,
): Promise<void> {
  const auth = ensureAuth();
  await confirmPasswordReset(auth, oobCode, newPassword);
}
