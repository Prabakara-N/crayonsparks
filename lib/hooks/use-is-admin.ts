"use client";

import { useEffect, useState } from "react";
import { orpc } from "@/lib/orpc/client";
import { useAuthContext } from "@/components/auth/auth-provider";
import { readCachedMe, writeCachedMe, clearCachedMe } from "@/lib/auth/cached-me";

export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user, loading: authLoading } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      clearCachedMe();
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const cached = readCachedMe();
    if (cached && cached.userId === user.uid) {
      setIsAdmin(cached.isAdmin);
      setLoading(false);
    }

    let cancelled = false;
    orpc.auth
      .me()
      .then((me) => {
        if (cancelled) return;
        setIsAdmin(!!me.isAdmin);
        writeCachedMe({
          userId: me.userId,
          email: me.email ?? null,
          displayName: user.displayName ?? null,
          photoURL: user.photoURL ?? null,
          isAdmin: !!me.isAdmin,
        });
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { isAdmin, loading };
}
