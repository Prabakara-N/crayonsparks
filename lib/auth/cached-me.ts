"use client";

// Client-only UX cache of the signed-in user's me() verdict. NEVER trusted by
// the server — every admin/protected call still re-checks on the backend. This
// only lets the client paint the right shell without waiting on a round-trip.
export interface CachedMe {
  userId: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
}

// Minimal identity shape the UI needs to paint an avatar/menu — a Firebase
// User satisfies it structurally, so either source can be passed to the UI.
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const KEY = "crayonsparks.me.v1";

export function readCachedMe(): CachedMe | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedMe>;
    if (typeof parsed?.userId !== "string") return null;
    return {
      userId: parsed.userId,
      email: typeof parsed.email === "string" ? parsed.email : null,
      displayName:
        typeof parsed.displayName === "string" ? parsed.displayName : null,
      photoURL: typeof parsed.photoURL === "string" ? parsed.photoURL : null,
      isAdmin: parsed.isAdmin === true,
    };
  } catch {
    return null;
  }
}

export function writeCachedMe(me: CachedMe): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(me));
  } catch {
    // Storage disabled or over quota — caching is best-effort.
  }
}

export function cachedAuthUser(): AuthUser | null {
  const c = readCachedMe();
  if (!c) return null;
  return {
    uid: c.userId,
    email: c.email,
    displayName: c.displayName,
    photoURL: c.photoURL,
  };
}

// Write/update the profile for any signed-in user (not just admins). Preserves
// a prior isAdmin verdict only when it belongs to the same user.
export function writeCachedUserProfile(user: AuthUser): void {
  const existing = readCachedMe();
  const isAdmin =
    existing && existing.userId === user.uid ? existing.isAdmin : false;
  writeCachedMe({
    userId: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAdmin,
  });
}

export function clearCachedMe(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Best-effort.
  }
}
