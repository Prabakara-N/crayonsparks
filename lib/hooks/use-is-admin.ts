"use client";

import { useEffect, useState } from "react";
import { orpc } from "@/lib/orpc/client";

export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    orpc.auth
      .me()
      .then((me) => {
        if (!cancelled) setIsAdmin(!!me.isAdmin);
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
  }, []);

  return { isAdmin, loading };
}
