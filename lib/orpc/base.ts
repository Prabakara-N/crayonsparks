import "server-only";

import { ORPCError, os } from "@orpc/server";
import type { OrpcContext } from "./context";

const base = os.$context<OrpcContext>();

const requireAuth = base.middleware(async ({ context, next }) => {
  if (!context.userId) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be signed in.",
    });
  }
  return next({
    context: { ...context, userId: context.userId },
  });
});

const requireAdmin = base.middleware(async ({ context, next }) => {
  if (!context.userId || !context.isAdmin) {
    throw new ORPCError("NOT_FOUND");
  }
  return next({
    context: { ...context, userId: context.userId },
  });
});

/** Any caller — signed in or not. */
export const publicProcedure = base;

/** Caller must be signed in (verified Firebase ID token). */
export const protectedProcedure = base.use(requireAuth);

/** Caller must be signed in AND have the `admin` custom claim. */
export const adminProcedure = base.use(requireAdmin);
