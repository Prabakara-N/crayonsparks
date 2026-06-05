"use client";

import { orpc } from "@/lib/orpc/client";

type EnsureUserResult = Awaited<ReturnType<typeof orpc.auth.ensureUser>>;

let inFlight: Promise<EnsureUserResult | null> | null = null;

// Shared in-flight dedupe: concurrent callers (auth provider + referral
// survey) collapse into one request instead of double-seeding the account.
export function ensureUserOnce(): Promise<EnsureUserResult | null> {
  if (inFlight) return inFlight;
  const pending = orpc.auth.ensureUser().catch(() => null);
  inFlight = pending;
  void pending.finally(() => {
    if (inFlight === pending) inFlight = null;
  });
  return pending;
}

export function resetEnsureUser(): void {
  inFlight = null;
}
