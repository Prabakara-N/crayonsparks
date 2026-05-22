import "server-only";

import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { getPackById } from "@/lib/billing/packs";
import { getPlanById } from "@/lib/billing/plans";
import {
  createCheckout,
  createSubscriptionCheckout,
} from "@/lib/billing/lemonsqueezy";
import { getBillingSummary } from "@/lib/firebase/users";
import { protectedProcedure } from "../base";

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
