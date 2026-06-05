"use client";

import { useCallback } from "react";
import { orpc } from "@/lib/orpc/client";
import { ensureUserOnce } from "@/lib/auth/ensure-user";

/**
 * Wraps the oRPC `auth.*` procedures so any component can call them
 * without re-typing error handling. The catch-all swallows transient
 * server errors — these calls are non-fatal for the sign-in flow.
 */
export function useAuth() {
  const ensureUser = useCallback(() => ensureUserOnce(), []);

  const me = useCallback(async () => {
    try {
      return await orpc.auth.me();
    } catch {
      return null;
    }
  }, []);

  return { ensureUser, me };
}
