"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./use-user";
import { orpc } from "@/lib/orpc/client";

interface AdminState {
  loading: boolean;
  isAdmin: boolean;
  user: ReturnType<typeof useUser>["user"];
}

/**
 * Client-side guard for /admin pages. Redirects:
 *   - signed-out → /login?next=/admin
 *   - signed-in but not admin → / (homepage)
 * Returns isAdmin only after a verified server check (admin.overview.stats).
 */
export function useRequireAdmin(): AdminState {
  const { user, loading } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/admin");
      return;
    }
    let cancelled = false;
    orpc.admin.overview
      .stats()
      .then(() => {
        if (cancelled) return;
        setIsAdmin(true);
      })
      .catch(() => {
        if (cancelled) return;
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

  return {
    loading: loading || checking,
    isAdmin,
    user,
  };
}
