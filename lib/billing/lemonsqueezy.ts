import "server-only";

import crypto from "node:crypto";
import { CREDIT_PACKS, type CreditPack } from "./packs";
import { PLANS, type BillingCycle, type Plan } from "./plans";

const LS_API = "https://api.lemonsqueezy.com/v1";

function env(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not configured.`);
  }
  return value;
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Reverse-lookup: which top-up pack does a Lemon Squeezy variant ID map to. */
export function resolvePackByVariantId(variantId: string): CreditPack | null {
  for (const pack of CREDIT_PACKS) {
    const configured = process.env[pack.variantEnvKey];
    if (configured && configured === variantId) {
      return pack;
    }
  }
  return null;
}

/** Reverse-lookup: which subscription plan does a variant ID map to. */
export function resolvePlanByVariantId(variantId: string): Plan | null {
  for (const plan of PLANS) {
    for (const key of [plan.variantEnvKeyMonthly, plan.variantEnvKeyAnnual]) {
      if (key && process.env[key] === variantId) {
        return plan;
      }
    }
  }
  return null;
}

function variantEnvKeyForPlan(plan: Plan, cycle: BillingCycle): string {
  const key =
    cycle === "annual" ? plan.variantEnvKeyAnnual : plan.variantEnvKeyMonthly;
  if (!key) {
    throw new Error(`Plan ${plan.id} has no ${cycle} variant.`);
  }
  return key;
}

async function createCheckoutForVariant(opts: {
  variantId: string;
  userId: string;
  email: string | null;
  custom: Record<string, string>;
}): Promise<string> {
  const res = await fetch(`${LS_API}/checkouts`, {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: {
      Authorization: `Bearer ${env("LEMONSQUEEZY_API_KEY")}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: opts.email ?? undefined,
            custom: opts.custom,
          },
          product_options: {
            redirect_url: `${appUrl()}/account/billing?purchase=success`,
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: env("LEMONSQUEEZY_STORE_ID") },
          },
          variant: {
            data: { type: "variants", id: opts.variantId },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Lemon Squeezy checkout failed (${res.status}): ${detail.slice(0, 300)}`,
    );
  }

  const json = (await res.json()) as {
    data?: { attributes?: { url?: unknown } };
  };
  const url = json.data?.attributes?.url;
  if (typeof url !== "string") {
    throw new Error("Lemon Squeezy response did not include a checkout URL.");
  }
  return url;
}

/** Hosted checkout for a one-time credit pack. */
export async function createCheckout(opts: {
  pack: CreditPack;
  userId: string;
  email: string | null;
}): Promise<string> {
  return createCheckoutForVariant({
    variantId: env(opts.pack.variantEnvKey),
    userId: opts.userId,
    email: opts.email,
    custom: { user_id: opts.userId, pack_id: opts.pack.id },
  });
}

/** Hosted checkout for a recurring subscription plan. */
export async function createSubscriptionCheckout(opts: {
  plan: Plan;
  cycle: BillingCycle;
  userId: string;
  email: string | null;
}): Promise<string> {
  return createCheckoutForVariant({
    variantId: env(variantEnvKeyForPlan(opts.plan, opts.cycle)),
    userId: opts.userId,
    email: opts.email,
    custom: { user_id: opts.userId, plan_id: opts.plan.id },
  });
}

/**
 * Cancels a subscription. Lemon Squeezy keeps it active until the end of
 * the paid period, then fires subscription_expired (→ downgrade to Free).
 */
export async function cancelSubscription(
  subscriptionId: string,
): Promise<void> {
  const res = await fetch(`${LS_API}/subscriptions/${subscriptionId}`, {
    method: "DELETE",
    signal: AbortSignal.timeout(15_000),
    headers: {
      Authorization: `Bearer ${env("LEMONSQUEEZY_API_KEY")}`,
      Accept: "application/vnd.api+json",
    },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Lemon Squeezy cancel failed (${res.status}): ${detail.slice(0, 200)}`,
    );
  }
}

/**
 * Verifies the `X-Signature` header on an incoming webhook — HMAC-SHA256
 * of the raw request body, keyed by LEMONSQUEEZY_WEBHOOK_SECRET.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const digest = crypto
    .createHmac("sha256", env("LEMONSQUEEZY_WEBHOOK_SECRET"))
    .update(rawBody)
    .digest("hex");
  const expected = Buffer.from(digest, "hex");
  let received: Buffer;
  try {
    received = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}
