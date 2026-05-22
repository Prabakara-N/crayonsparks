import "server-only";

import { getAdminAuth } from "@/lib/firebase/admin";
import { ensureUserDocument } from "@/lib/firebase/users";
import { protectedProcedure } from "../base";

export const authRouter = {
  me: protectedProcedure.handler(async ({ context }) => {
    return {
      userId: context.userId,
      email: context.email,
      isAdmin: context.isAdmin,
    };
  }),
  ensureUser: protectedProcedure.handler(async ({ context }) => {
    const userId = context.userId as string;
    const record = await getAdminAuth().getUser(userId);
    const profile = await ensureUserDocument({
      uid: userId,
      email: record.email ?? null,
      displayName: record.displayName ?? null,
      photoURL: record.photoURL ?? null,
      signInProvider: record.providerData[0]?.providerId ?? null,
    });
    return profile;
  }),
};
