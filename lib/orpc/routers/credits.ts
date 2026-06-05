import "server-only";

import { z } from "zod";
import {
  getCreditBalance,
  listCreditLedger,
} from "@/lib/firebase/credits";
import { db } from "@/lib/firebase/admin";
import { buildUsageSeries, type UsageSpend } from "@/lib/credits/usage-series";
import { protectedProcedure } from "../base";

const LedgerInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
});

export const LEDGER_CATEGORIES = [
  "all",
  "coloring",
  "story",
  "activity",
  "grant",
] as const;

const LedgerPageInput = z.object({
  category: z.enum(LEDGER_CATEGORIES).default("all"),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(50).default(15),
});

const UsageInput = z.object({
  fromMs: z.number().int().nonnegative().optional(),
  toMs: z.number().int().nonnegative().optional(),
  days: z.number().int().min(1).max(120).optional(),
});

export type LedgerCategory = (typeof LEDGER_CATEGORIES)[number];

export function entryCategory(
  refKind: string,
  reason: string,
): Exclude<LedgerCategory, "all"> {
  if (refKind !== "spend") return "grant";
  if (/activit/i.test(reason)) return "activity";
  if (/story/i.test(reason)) return "story";
  return "coloring";
}

export const creditsRouter = {
  balance: protectedProcedure.handler(async ({ context }) => {
    const balance = await getCreditBalance(context.userId as string);
    return { balance };
  }),

  ledger: protectedProcedure
    .input(LedgerInput)
    .handler(async ({ input, context }) => {
      const [balance, entries] = await Promise.all([
        getCreditBalance(context.userId as string),
        listCreditLedger(context.userId as string, input.limit),
      ]);
      return { balance, entries };
    }),

  ledgerPage: protectedProcedure
    .input(LedgerPageInput)
    .handler(async ({ input, context }) => {
      const all = await listCreditLedger(context.userId as string, 2000);
      const tagged = all.map((e) => ({
        ...e,
        category: entryCategory(e.refKind, e.reason),
      }));
      const filtered =
        input.category === "all"
          ? tagged
          : tagged.filter((e) => e.category === input.category);
      const total = filtered.length;
      const start = input.page * input.pageSize;
      const entries = filtered.slice(start, start + input.pageSize);
      return { entries, total, page: input.page, pageSize: input.pageSize };
    }),

  usage: protectedProcedure
    .input(UsageInput)
    .handler(async ({ context, input }) => {
      const DAY = 24 * 60 * 60 * 1000;
      const now = Date.now();
      const end = input.toMs ?? now;
      const start = input.fromMs ?? end - (input.days ?? 30) * DAY;

      const snap = await db
        .collection("users")
        .doc(context.userId as string)
        .collection("credits")
        .orderBy("createdAt", "desc")
        .limit(3000)
        .get();

      const spends: UsageSpend[] = snap.docs
        .map((d) => d.data())
        .filter((data) => (data.refKind as string | undefined) === "spend")
        .map((data) => ({
          at: (data.createdAt?.toMillis?.() as number | undefined) ?? 0,
          delta: (data.delta as number) ?? 0,
          reason: (data.reason as string | undefined) ?? "",
        }));

      return buildUsageSeries(spends, start, end);
    }),
};
