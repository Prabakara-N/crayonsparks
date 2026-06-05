import "server-only";

import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, db } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/firebase/audit";
import { adjustCredits, InsufficientCreditsError } from "@/lib/firebase/credits";
import { getReadUrl } from "@/lib/storage/sign-url";
import { FEEDBACK_STATUSES, FEEDBACK_KINDS } from "@/lib/feedback/types";
import { buildUsageSeries, type UsageSpend } from "@/lib/credits/usage-series";
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
      const cutoff = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);

      let generations24h = 0;
      try {
        const gSnap = await db
          .collectionGroup("books")
          .where("createdAt", ">=", cutoff)
          .count()
          .get();
        generations24h = gSnap.data().count;
      } catch {
        generations24h = 0;
      }

      let creditsGranted24h = 0;
      let creditsSpent24h = 0;
      try {
        const cSnap = await db
          .collectionGroup("credits")
          .where("createdAt", ">=", cutoff)
          .get();
        for (const doc of cSnap.docs) {
          const data = doc.data();
          const delta = (data.delta as number) ?? 0;
          const refKind = (data.refKind as string) ?? "";
          if (refKind === "spend") creditsSpent24h += Math.abs(delta);
          else if (delta > 0) creditsGranted24h += delta;
        }
      } catch {
        // index may still be building — leave the 24h credit totals at 0
      }

      return {
        totalUsers: usersCount,
        generations24h,
        creditsGranted24h,
        creditsSpent24h,
        creditUsdRate: 0.013,
      };
    }),
  },

  generations: {
    list: adminProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(100).default(50),
          kind: z.enum(["coloring", "story", "activity", "all"]).default("all"),
        }),
      )
      .handler(async ({ input }) => {
        const snap = await db
          .collectionGroup("books")
          .orderBy("createdAt", "desc")
          .limit(input.limit * 2)
          .get();

        const items = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            const ownerUid =
              (data.ownerUid as string | undefined) ?? d.ref.parent.parent?.id ?? null;
            const mode = (data.mode as "qa" | "story" | "activity") ?? "qa";
            const kind: "coloring" | "story" | "activity" =
              mode === "story"
                ? "story"
                : mode === "activity"
                  ? "activity"
                  : "coloring";
            const thumbKey = data.cover?.thumb?.key as string | undefined;
            return {
              bookId: d.id,
              ownerUid,
              title: (data.coverTitle as string) ?? (data.title as string) ?? "",
              kind,
              mode,
              pageCount: (data.pageCount as number | undefined) ?? 0,
              coverThumbUrl: thumbKey ? await getReadUrl(thumbKey, 600) : null,
              createdAt: data.createdAt?.toMillis?.() ?? null,
            };
          }),
        );

        const filtered = items.filter(
          (it) => input.kind === "all" || it.kind === input.kind,
        );
        const ownerUids = Array.from(
          new Set(filtered.map((it) => it.ownerUid).filter(Boolean)),
        ) as string[];
        const userDocs = await Promise.all(
          ownerUids.map((uid) => db.collection("users").doc(uid).get()),
        );
        const userMap = new Map(
          userDocs.map((d) => [
            d.id,
            (d.data()?.email as string | null) ?? null,
          ]),
        );

        return {
          items: filtered.slice(0, input.limit).map((it) => ({
            ...it,
            ownerEmail: it.ownerUid ? userMap.get(it.ownerUid) ?? null : null,
          })),
        };
      }),
  },

  credits: {
    list: adminProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(500).default(100),
          refKind: z
            .enum(["all", "signup", "grant", "purchase", "spend", "refund"])
            .default("all"),
        }),
      )
      .handler(async ({ input }) => {
        const base = db.collectionGroup("credits");
        let query = base.orderBy("createdAt", "desc").limit(input.limit * 2);
        if (input.refKind !== "all") {
          query = base
            .where("refKind", "==", input.refKind)
            .orderBy("createdAt", "desc")
            .limit(input.limit);
        }
        const snap = await query.get();
        const items = snap.docs.map((d) => {
          const data = d.data();
          const ownerUid = d.ref.parent.parent?.id ?? null;
          return {
            id: d.id,
            ownerUid,
            delta: (data.delta as number) ?? 0,
            balanceAfter: (data.balanceAfter as number | null) ?? null,
            reason: (data.reason as string) ?? "",
            refKind: (data.refKind as string) ?? "grant",
            refId: (data.refId as string | null) ?? null,
            createdByEmail: (data.createdByEmail as string | null) ?? null,
            createdAt: data.createdAt?.toMillis?.() ?? null,
          };
        });
        const limited = items.slice(0, input.limit);
        const ownerUids = Array.from(
          new Set(limited.map((it) => it.ownerUid).filter(Boolean)),
        ) as string[];
        const userDocs = await Promise.all(
          ownerUids.map((uid) => db.collection("users").doc(uid).get()),
        );
        const userMap = new Map(
          userDocs.map((d) => [
            d.id,
            (d.data()?.email as string | null) ?? null,
          ]),
        );
        return {
          items: limited.map((it) => ({
            ...it,
            ownerEmail: it.ownerUid ? userMap.get(it.ownerUid) ?? null : null,
          })),
        };
      }),
  },

  feedback: {
    list: adminProcedure
      .input(
        z.object({
          status: z
            .enum(["all", ...FEEDBACK_STATUSES])
            .default("all"),
          kind: z.enum(["all", ...FEEDBACK_KINDS]).default("all"),
          limit: z.number().int().min(1).max(200).default(100),
        }),
      )
      .handler(async ({ input }) => {
        let query = db
          .collection("feedback")
          .orderBy("createdAt", "desc")
          .limit(input.limit * 2);
        if (input.status !== "all") {
          query = db
            .collection("feedback")
            .where("status", "==", input.status)
            .orderBy("createdAt", "desc")
            .limit(input.limit);
        }
        const snap = await query.get();
        const items = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              userId: (data.userId as string) ?? "",
              userEmail: (data.userEmail as string | null) ?? null,
              kind: (data.kind as string) ?? "feedback",
              title: (data.title as string) ?? "",
              body: (data.body as string) ?? "",
              page: (data.page as string | null) ?? null,
              status: (data.status as string) ?? "open",
              hasScreenshot: Boolean(data.screenshotKey),
              createdAt: data.createdAt?.toMillis?.() ?? null,
            };
          })
          .filter(
            (it) => input.kind === "all" || it.kind === input.kind,
          )
          .slice(0, input.limit);
        return { items };
      }),

    get: adminProcedure
      .input(z.object({ id: z.string().min(1) }))
      .handler(async ({ input }) => {
        const snap = await db.collection("feedback").doc(input.id).get();
        if (!snap.exists) {
          throw new ORPCError("NOT_FOUND", { message: "Feedback not found." });
        }
        const data = snap.data() ?? {};
        const screenshotKey = (data.screenshotKey as string | null) ?? null;
        const screenshotUrl = screenshotKey
          ? await getReadUrl(screenshotKey, 3600)
          : null;
        return {
          id: snap.id,
          userId: (data.userId as string) ?? "",
          userEmail: (data.userEmail as string | null) ?? null,
          kind: (data.kind as string) ?? "feedback",
          title: (data.title as string) ?? "",
          body: (data.body as string) ?? "",
          page: (data.page as string | null) ?? null,
          userAgent: (data.userAgent as string | null) ?? null,
          status: (data.status as string) ?? "open",
          adminNotes: (data.adminNotes as string | null) ?? "",
          screenshotUrl,
          createdAt: data.createdAt?.toMillis?.() ?? null,
          updatedAt: data.updatedAt?.toMillis?.() ?? null,
          respondedAt: data.respondedAt?.toMillis?.() ?? null,
        };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.string().min(1),
          status: z.enum(FEEDBACK_STATUSES).optional(),
          adminNotes: z.string().max(4000).optional(),
        }),
      )
      .handler(async ({ input }) => {
        const ref = db.collection("feedback").doc(input.id);
        const patch: Record<string, unknown> = {
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (input.status) {
          patch.status = input.status;
          if (input.status === "resolved") {
            patch.respondedAt = FieldValue.serverTimestamp();
          }
        }
        if (input.adminNotes !== undefined) {
          patch.adminNotes = input.adminNotes;
        }
        await ref.set(patch, { merge: true });
        return { ok: true };
      }),
  },

  referrals: {
    summary: adminProcedure.handler(async () => {
      const snap = await db.collection("users").get();
      const counts = new Map<string, number>();
      let answered = 0;
      let unanswered = 0;
      const otherTexts: Array<{ uid: string; text: string }> = [];
      for (const doc of snap.docs) {
        const data = doc.data();
        const source = (data.referralSource as string | null | undefined) ?? null;
        if (!source) {
          unanswered += 1;
          continue;
        }
        answered += 1;
        counts.set(source, (counts.get(source) ?? 0) + 1);
        if (source === "other") {
          const text = (data.referralSourceOther as string | null) ?? null;
          if (text) otherTexts.push({ uid: doc.id, text });
        }
      }
      const items = Array.from(counts.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);
      return {
        total: snap.size,
        answered,
        unanswered,
        items,
        otherTexts: otherTexts.slice(0, 50),
      };
    }),
  },

  costs: {
    daily: adminProcedure
      .input(
        z.object({
          fromMs: z.number().int().nonnegative().optional(),
          toMs: z.number().int().nonnegative().optional(),
          days: z.number().int().min(1).max(120).optional(),
        }),
      )
      .handler(async ({ input }) => {
        const DAY = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const end = input.toMs ?? now;
        const start = input.fromMs ?? end - (input.days ?? 30) * DAY;

        const snap = await db
          .collectionGroup("credits")
          .where("refKind", "==", "spend")
          .orderBy("createdAt", "desc")
          .limit(8000)
          .get();

        const spends: UsageSpend[] = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            at: (data.createdAt?.toMillis?.() as number | undefined) ?? 0,
            delta: (data.delta as number) ?? 0,
            reason: (data.reason as string | undefined) ?? "",
          };
        });

        return {
          ...buildUsageSeries(spends, start, end),
          creditUsdRate: 0.013,
        };
      }),
  },
};
