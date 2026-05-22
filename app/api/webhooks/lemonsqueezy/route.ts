import { verifyWebhookSignature } from "@/lib/billing/lemonsqueezy";
import {
  handleOrderCreated,
  handleSubscriptionSync,
  handleSubscriptionPayment,
  handleSubscriptionExpired,
  type WebhookResult,
} from "@/lib/billing/webhook-handlers";

export const runtime = "nodejs";

/**
 * Lemon Squeezy webhook. Authenticated solely by the HMAC `X-Signature`
 * header — never by a session. Dispatches credit-pack purchases and the
 * subscription lifecycle. All credit grants are idempotent, so a webhook
 * redelivery (5xx retry) is always safe.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!verifyWebhookSignature(rawBody, req.headers.get("x-signature"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const event = payload as {
    meta?: { event_name?: string };
  };
  const name = event.meta?.event_name;

  try {
    let result: WebhookResult;
    switch (name) {
      case "order_created":
        result = await handleOrderCreated(payload as never);
        break;
      case "subscription_created":
      case "subscription_updated":
      case "subscription_cancelled":
      case "subscription_resumed":
      case "subscription_paused":
      case "subscription_unpaused":
        result = await handleSubscriptionSync(payload as never);
        break;
      case "subscription_payment_success":
        result = await handleSubscriptionPayment(payload as never);
        break;
      case "subscription_expired":
        result = await handleSubscriptionExpired(payload as never);
        break;
      default:
        return new Response(null, { status: 204 });
    }
    return new Response(result.message, { status: result.status });
  } catch {
    // 5xx — Lemon Squeezy retries; every handler is idempotent.
    return new Response("Webhook processing failed", { status: 500 });
  }
}
