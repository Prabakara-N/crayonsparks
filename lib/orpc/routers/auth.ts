import "server-only";

import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  ensureUserDocument,
  setReferralSource,
} from "@/lib/firebase/users";
import { isReferralSource } from "@/lib/referrals/sources";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";
import { protectedProcedure, publicProcedure } from "../base";

const ReferralInput = z.object({
  source: z.string().min(1).max(40),
  other: z.string().max(200).optional(),
});

const PasswordResetInput = z.object({
  email: z.string().email().max(320),
});

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

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
  requestPasswordReset: publicProcedure
    .input(PasswordResetInput)
    .handler(async ({ input }) => {
      const email = input.email.trim().toLowerCase();
      try {
        const link = await getAdminAuth().generatePasswordResetLink(email);
        const oobCode = new URL(link).searchParams.get("oobCode");
        if (oobCode) {
          const resetUrl = `${getSiteUrl()}/reset-password?oobCode=${encodeURIComponent(oobCode)}`;
          await sendPasswordResetEmail({ to: email, resetUrl });
        }
      } catch (err) {
        const code =
          err && typeof err === "object" && "code" in err
            ? (err as { code?: string }).code
            : undefined;
        if (code !== "auth/user-not-found") {
          console.warn("[auth.requestPasswordReset] suppressed error", err);
        }
      }
      return { ok: true as const };
    }),
};
