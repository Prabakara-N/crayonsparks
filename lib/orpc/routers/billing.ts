import "server-only";

import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { getPackById } from "@/lib/billing/packs";
import { getPlanById } from "@/lib/billing/plans";
import {
  createCheckout,
  createSubscriptionCheckout,
  cancelSubscription as cancelLsSubscription,
} from "@/lib/billing/lemonsqueezy";
import { getBillingSummary } from "@/lib/firebase/users";
import { getSubscriptionId } from "@/lib/firebase/subscriptions";
import { db } from "@/lib/firebase/admin";
import { buildUsageSeries, type UsageSpend } from "@/lib/credits/usage-series";
import { protectedProcedure } from "../base";

const UsageInput = z.object({
  fromMs: z.number().int().nonnegative().optional(),
  toMs: z.number().int().nonnegative().optional(),
  days: z.number().int().min(1).max(120).optional(),
});

const CheckoutInput = z.object({
  packId: z.string().min(1),
});

const SubscriptionCheckoutInput = z.object({
  planId: z.enum(["hobbyist", "pro"]),
  cycle: z.enum(["monthly", "annual"]),
});

export const billingRouter = {
  summary: protectedProcedure.handler(async ({ context }) => {
    return getBillingSummary(context.userId as string);
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

  createCheckout: protectedProcedure
    .input(CheckoutInput)
    .handler(async ({ input, context }) => {
      const pack = getPackById(input.packId);
      if (!pack) {
        throw new ORPCError("NOT_FOUND", {
          message: "Unknown credit pack.",
        });
      }
      try {
        const url = await createCheckout({
          pack,
          userId: context.userId as string,
          email: context.email ?? null,
        });
        return { url };
      } catch (e) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message:
            e instanceof Error
              ? e.message
              : "Could not start checkout. Try again shortly.",
        });
      }
    }),

  cancelSubscription: protectedProcedure.handler(async ({ context }) => {
    const subscriptionId = await getSubscriptionId(context.userId as string);
    if (!subscriptionId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "No active subscription to cancel.",
      });
    }
    try {
      await cancelLsSubscription(subscriptionId);
      return { ok: true };
    } catch (e) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message:
          e instanceof Error
            ? e.message
            : "Could not cancel the subscription. Try again shortly.",
      });
    }
  }),

  createSubscriptionCheckout: protectedProcedure
    .input(SubscriptionCheckoutInput)
    .handler(async ({ input, context }) => {
      const plan = getPlanById(input.planId);
      if (plan.id === "free") {
        throw new ORPCError("BAD_REQUEST", {
          message: "The Free plan has no checkout.",
        });
      }
      try {
        const url = await createSubscriptionCheckout({
          plan,
          cycle: input.cycle,
          userId: context.userId as string,
          email: context.email ?? null,
        });
        return { url };
      } catch (e) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message:
            e instanceof Error
              ? e.message
              : "Could not start checkout. Try again shortly.",
        });
      }
    }),
};
