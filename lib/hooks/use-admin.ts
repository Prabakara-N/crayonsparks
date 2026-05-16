"use client";

import { useCallback } from "react";
import { orpc } from "@/lib/orpc/client";

export function useAdmin() {
  return {
    listUsers: useCallback(
      (params: { search?: string; limit?: number }) =>
        orpc.admin.users.list({
          limit: params.limit ?? 50,
          search: params.search,
        }),
      [],
    ),
    getUser: useCallback(
      (uid: string) => orpc.admin.users.get({ uid }),
      [],
    ),
    grantCredits: useCallback(
      (uid: string, delta: number, reason: string) =>
        orpc.admin.users.grantCredits({ uid, delta, reason }),
      [],
    ),
    setStatus: useCallback(
      (uid: string, status: "active" | "disabled") =>
        orpc.admin.users.setStatus({ uid, status }),
      [],
    ),
    forceSignOut: useCallback(
      (uid: string) => orpc.admin.users.forceSignOut({ uid }),
      [],
    ),
    listAudit: useCallback(
      (limit?: number) => orpc.admin.audit.list({ limit: limit ?? 100 }),
      [],
    ),
    overviewStats: useCallback(() => orpc.admin.overview.stats(), []),
  };
}
