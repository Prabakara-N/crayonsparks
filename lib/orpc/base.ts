import "server-only";

import { ORPCError, os } from "@orpc/server";
import type { OrpcContext } from "./context";

export const base = os.$context<OrpcContext>();

export const requireAuth = base.middleware(async ({ context, next }) => {
  if (!context.userId) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be signed in.",
    });
  }
  return next({
    context: { ...context, userId: context.userId },
  });
});
