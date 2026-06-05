"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./use-user";
import { orpc } from "@/lib/orpc/client";
import {
  readCachedMe,
  writeCachedMe,
  clearCachedMe,
  type CachedMe,
} from "@/lib/auth/cached-me";

export interface AdminDisplayUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AdminState {
  loading: boolean;
  isAdmin: boolean;
  user: AdminDisplayUser | null;
}

/**
 * Client-side guard for /admin pages. Renders optimistically from a cached
 * admin verdict (so the shell paints without waiting on Firebase session
 * restore), then revalidates against the server. The server still enforces
 * admin on every call — the cache only controls what UI paints first.
 */
export function useRequireAdmin(): AdminState {
  const { user, loading } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cached, setCached] = useState<CachedMe | null>(null);

  useEffect(() => {
    const c = readCachedMe();
    if (c?.isAdmin) {
      setCached(c);
      setIsAdmin(true);
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      clearCachedMe();
      router.replace("/login?next=/admin");
      return;
    }
    let cancelled = false;
    orpc.admin.overview
      .stats()
      .then(() => {
        if (cancelled) return;
        const me: CachedMe = {
          userId: user.uid,
          email: user.email ?? null,
          displayName: user.displayName ?? null,
          photoURL: user.photoURL ?? null,
          isAdmin: true,
        };
        writeCachedMe(me);
        setCached(me);
        setIsAdmin(true);
      })
      .catch(() => {
        if (cancelled) return;
        clearCachedMe();
        setIsAdmin(false);
        router.replace("/");
      })
      .finally(() => {
        if (cancelled) return;
        setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading, router]);

  const displayUser: AdminDisplayUser | null = user
    ? {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      }
    : cached
      ? {
          displayName: cached.displayName,
          email: cached.email,
          photoURL: cached.photoURL,
        }
      : null;

  const blocking = cached?.isAdmin ? false : loading || checking;

  return { loading: blocking, isAdmin, user: displayUser };
}
