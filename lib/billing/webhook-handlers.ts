import "server-only";

import { getPlanById } from "./plans";
import {
  resolvePackByVariantId,
  resolvePlanByVariantId,
} from "./lemonsqueezy";
import { applyPurchaseCredits } from "@/lib/firebase/orders";
import {
  applySubscriptionCredits,
  updateSubscriptionState,
} from "@/lib/firebase/subscriptions";

export interface WebhookResult {
  status: number;
  message: string;
}

interface LsPayload {
  meta?: {
    event_name?: string;
    custom_data?: { user_id?: string; plan_id?: string; pack_id?: string };
  };
  data?: {
    id?: string | number;
    attributes?: {
      status?: string;
      billing_reason?: string;
      renews_at?: string;
      variant_id?: string | number;
      first_order_item?: { variant_id?: string | number };
      urls?: { customer_portal?: string };
    };
  };
}

function ok(message: string): WebhookResult {
  return { status: 200, message };
}

/** order_created — one-time credit-pack purchase. */
export async function handleOrderCreated(
  payload: LsPayload,
): Promise<WebhookResult> {
  const userId = payload.meta?.custom_data?.user_id;
  const orderId =
    payload.data?.id != null ? String(payload.data.id) : null;
  const variantId = payload.data?.attributes?.first_order_item?.variant_id;
  const status = payload.data?.attributes?.status;

  if (!userId || !orderId || variantId == null) {
    return { status: 400, message: "Missing required order fields" };
  }
  if (status && status !== "paid") {
    return ok("Order not paid — ignored");
  }
  const pack = resolvePackByVariantId(String(variantId));
  if (!pack) {
    return { status: 202, message: "No matching credit pack" };
  }
  const result = await applyPurchaseCredits({
    uid: userId,
    credits: pack.credits,
    orderId,
    packId: pack.id,
    reason: `Purchased ${pack.name} — ${pack.credits} credits.`,
  });
  return ok(result.duplicate ? "Order already processed" : "Credits granted");
}

/** subscription_created / subscription_updated — sync plan + state. */
export async function handleSubscriptionSync(
  payload: LsPayload,
): Promise<WebhookResult> {
  const userId = payload.meta?.custom_data?.user_id;
  const subscriptionId =
    payload.data?.id != null ? String(payload.data.id) : null;
  if (!userId || !subscriptionId) {
    return { status: 400, message: "Missing subscription fields" };
  }

  const attrs = payload.data?.attributes ?? {};
  const planFromVariant =
    attrs.variant_id != null
      ? resolvePlanByVariantId(String(attrs.variant_id))
      : null;
  const planId =
    payload.meta?.custom_data?.plan_id ?? planFromVariant?.id;

  await updateSubscriptionState(userId, {
    planId: planId ? getPlanById(planId).id : undefined,
    subscriptionId,
    status: attrs.status ?? null,
    renewsAt: attrs.renews_at ?? null,
    customerPortalUrl: attrs.urls?.customer_portal ?? undefined,
  });
  return ok("Subscription state synced");
}

/** subscription_payment_success — grant monthly credits (idempotent). */
export async function handleSubscriptionPayment(
  payload: LsPayload,
): Promise<WebhookResult> {
  const userId = payload.meta?.custom_data?.user_id;
  const invoiceId =
    payload.data?.id != null ? String(payload.data.id) : null;
  const status = payload.data?.attributes?.status;

  if (!userId || !invoiceId) {
    console.error("[lemonsqueezy] payment webhook missing user_id/invoiceId", {
      userId,
      invoiceId,
    });
    return { status: 400, message: "Missing payment fields" };
  }
  if (status && status !== "paid") {
    return ok("Invoice not paid — ignored");
  }

  const customPlanId = payload.meta?.custom_data?.plan_id;
  const variantId = payload.data?.attributes?.variant_id;
  const planFromVariant =
    variantId != null ? resolvePlanByVariantId(String(variantId)) : null;
  const resolvedPlanId =
    customPlanId ?? planFromVariant?.id ?? null;

  if (!resolvedPlanId) {
    console.error("[lemonsqueezy] cannot resolve plan from payment payload", {
      userId,
      invoiceId,
      variantId,
    });
    return {
      status: 422,
      message:
        "Cannot resolve plan — missing custom_data.plan_id and unknown variant_id.",
    };
  }

  const plan = getPlanById(resolvedPlanId);
  if (plan.id === "free") {
    console.error("[lemonsqueezy] resolved plan is free — refusing to grant", {
      userId,
      invoiceId,
      resolvedPlanId,
    });
    return { status: 422, message: `Unknown subscription plan: ${resolvedPlanId}` };
  }

  const result = await applySubscriptionCredits({
    uid: userId,
    monthlyCredits: plan.monthlyCredits,
    rolloverCap: plan.rolloverCap,
    eventId: invoiceId,
    reason: `${plan.name} subscription — ${plan.monthlyCredits} monthly credits.`,
  });
  await updateSubscriptionState(userId, {
    planId: plan.id,
    status: "active",
  });
  console.log("[lemonsqueezy] subscription payment processed", {
    userId,
    invoiceId,
    planId: plan.id,
    granted: result.granted,
    duplicate: result.duplicate,
    newBalance: result.newBalance,
  });
  return ok(
    result.duplicate
      ? "Payment already processed"
      : `Granted ${result.granted} credits`,
  );
}

/** subscription_expired — downgrade to Free. */
export async function handleSubscriptionExpired(
  payload: LsPayload,
): Promise<WebhookResult> {
  const userId = payload.meta?.custom_data?.user_id;
  if (!userId) {
    return { status: 400, message: "Missing user_id" };
  }
  await updateSubscriptionState(userId, {
    planId: "free",
    subscriptionId: null,
    status: "expired",
    renewsAt: null,
  });
  return ok("Subscription expired — downgraded to Free");
}
