"use client";

import { firebaseAuth } from "@/lib/firebase/client";

export interface AuthGate {
  ready: boolean;
  idToken: string | null;
}

export async function getAuthIdToken(): Promise<string | null> {
  if (!firebaseAuth?.currentUser) return null;
  try {
    return await firebaseAuth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

export function redirectToLogin(nextPath: string): void {
  if (typeof window === "undefined") return;
  const url = `/login?next=${encodeURIComponent(nextPath)}`;
  window.location.href = url;
}
