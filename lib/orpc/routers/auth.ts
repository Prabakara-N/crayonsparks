import "server-only";

import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  ensureUserDocument,
  setReferralSource,
} from "@/lib/firebase/users";
import { isReferralSource } from "@/lib/referrals/sources";
import { protectedProcedure } from "../base";

const ReferralInput = z.object({
  source: z.string().min(1).max(40),
  other: z.string().max(200).optional(),
});

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
  setReferralSource: protectedProcedure
    .input(ReferralInput)
    .handler(async ({ input, context }) => {
      const allowed =
        isReferralSource(input.source) || input.source === "skipped";
      if (!allowed) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Unknown referral source.",
        });
      }
      await setReferralSource({
        uid: context.userId as string,
        source: input.source,
        other: input.source === "other" ? input.other ?? null : null,
      });
      return { ok: true };
    }),
};
