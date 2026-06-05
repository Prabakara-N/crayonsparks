"use client";

import { useEffect, useState } from "react";
import { cachedAuthUser, type AuthUser } from "@/lib/auth/cached-me";

// Reads the last-known signed-in profile from localStorage AFTER mount (never
// during render) so there's no SSR/client hydration mismatch. Lets the navbar
// paint the avatar instantly instead of waiting on Firebase session restore.
export function useCachedUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    setUser(cachedAuthUser());
  }, []);
  return user;
}
