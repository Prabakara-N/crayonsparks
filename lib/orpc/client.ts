"use client";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { firebaseAuth } from "@/lib/firebase/client";
import type { AppRouter } from "./router";

async function getAuthHeader(): Promise<Record<string, string>> {
  if (!firebaseAuth) return {};
  await firebaseAuth.authStateReady();
  if (!firebaseAuth.currentUser) return {};
  try {
    const token = await firebaseAuth.currentUser.getIdToken();
    return { authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

const link = new RPCLink({
  url: () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/api/orpc`
      : "/api/orpc",
  headers: async () => getAuthHeader(),
});

export const orpc: RouterClient<AppRouter> = createORPCClient(link);
