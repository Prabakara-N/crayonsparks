import "server-only";

import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { getAdminAuth, db } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/firebase/audit";
import { adjustCredits, InsufficientCreditsError } from "@/lib/firebase/credits";
import { adminProcedure } from "../base";

const UsersListInput = z.object({
  search: z.string().trim().toLowerCase().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

const UsersGetInput = z.object({ uid: z.string().min(1) });

const GrantCreditsInput = z.object({
  uid: z.string().min(1),
  delta: z
    .number()
    .int()
    .min(-10_000)
    .max(10_000)
    .refine((v) => v !== 0, "Delta cannot be zero"),
  reason: z.string().trim().min(8).max(200),
});

const SetStatusInput = z.object({
  uid: z.string().min(1),
  status: z.enum(["active", "disabled"]),
});

const ForceSignOutInput = z.object({ uid: z.string().min(1) });

const AuditListInput = z.object({
  limit: z.number().int().min(1).max(200).default(100),
});

export const adminRouter = {
  users: {
    list: adminProcedure
      .input(UsersListInput)
      .handler(async ({ input }) => {
        let q = db
          .collection("users")
          .orderBy("createdAt", "desc")
          .limit(input.limit);
        const snap = await q.get();
        const items = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            email: (data.email as string | null) ?? null,
            displayName: (data.displayName as string | null) ?? null,
            photoURL: (data.photoURL as string | null) ?? null,
            creditsBalance: (data.creditsBalance as number | undefined) ?? 0,
            signInProvider: (data.signInProvider as string | null) ?? null,
            createdAt: data.createdAt?.toMillis() ?? null,
            lastSignInAt: data.lastSignInAt?.toMillis() ?? null,
          };
        });
        const filtered = input.search
          ? items.filter((u) =>
              [u.email, u.displayName, u.uid]
                .filter(Boolean)
                .map((s) => (s as string).toLowerCase())
                .some((s) => s.includes(input.search as string)),
            )
          : items;
        return { items: filtered };
      }),

    get: adminProcedure.input(UsersGetInput).handler(async ({ input }) => {
      const userRef = db.collection("users").doc(input.uid);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        throw new ORPCError("NOT_FOUND", { message: "User not found." });
      }
      const data = userSnap.data() ?? {};
      const profile = {
        uid: input.uid,
        email: (data.email as string | null) ?? null,
        displayName: (data.displayName as string | null) ?? null,
        photoURL: (data.photoURL as string | null) ?? null,
        creditsBalance: (data.creditsBalance as number | undefined) ?? 0,
        signInProvider: (data.signInProvider as string | null) ?? null,
        createdAt: data.createdAt?.toMillis() ?? null,
        updatedAt: data.updatedAt?.toMillis() ?? null,
        lastSignInAt: data.lastSignInAt?.toMillis() ?? null,
      };

      const ledgerSnap = await userRef
        .collection("credits")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
      const ledger = ledgerSnap.docs.map((d) => {
        const ld = d.data();
        return {
          id: d.id,
          delta: (ld.delta as number) ?? 0,
          balanceAfter: (ld.balanceAfter as number | null) ?? null,
          reason: (ld.reason as string) ?? "",
          refKind: (ld.refKind as string) ?? "grant",
          createdByEmail: (ld.createdByEmail as string | null) ?? null,
          createdAt: ld.createdAt?.toMillis() ?? null,
        };
      });

      let disabled = false;
      try {
        const record = await getAdminAuth().getUser(input.uid);
        disabled = record.disabled;
      } catch {
        // user may have been deleted from Auth — leave defaults
      }

      return { profile: { ...profile, disabled }, ledger };
    }),

    grantCredits: adminProcedure
      .input(GrantCreditsInput)
      .handler(async ({ input, context }) => {
        let newBalance: number;
        try {
          newBalance = await adjustCredits({
            uid: input.uid,
            delta: input.delta,
            reason: input.reason,
            createdByUid: context.userId as string,
            createdByEmail: context.email,
          });
        } catch (e) {
          if (e instanceof InsufficientCreditsError) {
            throw new ORPCError("BAD_REQUEST", {
              message: `Cannot bring balance below 0 (have ${e.current}, delta ${input.delta}).`,
            });
          }
          throw new ORPCError("NOT_FOUND", { message: "User not found." });
        }

        await writeAuditLog({
          adminUid: context.userId as string,
          adminEmail: context.email,
          action: "grantCredits",
          targetUid: input.uid,
          payload: { delta: input.delta, reason: input.reason, newBalance },
        });

        return { uid: input.uid, newBalance };
      }),

    setStatus: adminProcedure
      .input(SetStatusInput)
      .handler(async ({ input, context }) => {
        const disabled = input.status === "disabled";
        await getAdminAuth().updateUser(input.uid, { disabled });
        await writeAuditLog({
          adminUid: context.userId as string,
          adminEmail: context.email,
          action: "setStatus",
          targetUid: input.uid,
          payload: { status: input.status },
        });
        return { uid: input.uid, status: input.status };
      }),

    forceSignOut: adminProcedure
      .input(ForceSignOutInput)
      .handler(async ({ input, context }) => {
        await getAdminAuth().revokeRefreshTokens(input.uid);
        await writeAuditLog({
          adminUid: context.userId as string,
          adminEmail: context.email,
          action: "forceSignOut",
          targetUid: input.uid,
        });
        return { uid: input.uid };
      }),
  },

  audit: {
    list: adminProcedure.input(AuditListInput).handler(async ({ input }) => {
      const snap = await db
        .collection("admin")
        .doc("logs")
        .collection("entries")
        .orderBy("createdAt", "desc")
        .limit(input.limit)
        .get();
      const items = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          adminUid: data.adminUid as string,
          adminEmail: (data.adminEmail as string | null) ?? null,
          action: data.action as string,
          targetUid: (data.targetUid as string | undefined) ?? null,
          payload: (data.payload as Record<string, unknown> | undefined) ?? {},
          createdAt: data.createdAt?.toMillis() ?? null,
        };
      });
      return { items };
    }),
  },

  overview: {
    stats: adminProcedure.handler(async () => {
      const usersSnap = await db.collection("users").count().get();
      const usersCount = usersSnap.data().count;
      return {
        totalUsers: usersCount,
      };
    }),
  },
};
