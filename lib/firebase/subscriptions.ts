import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin";

export interface SubscriptionState {
  planId: string;
  subscriptionId: string | null;
  status: string | null;
  renewsAt: string | null;
  customerPortalUrl: string | null;
}

/**
 * Writes the user's subscription state. Plain merge — safe to call from
 * subscription_created / _updated / _payment_success. Pass `planId: "free"`
 * with null subscription fields to downgrade on expiry.
 */
export async function updateSubscriptionState(
  uid: string,
  state: Partial<SubscriptionState>,
): Promise<void> {
  const patch: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (state.planId !== undefined) patch.plan = state.planId;
  if (state.subscriptionId !== undefined)
    patch.subscriptionId = state.subscriptionId;
  if (state.status !== undefined) patch.subscriptionStatus = state.status;
  if (state.renewsAt !== undefined)
    patch.subscriptionRenewsAt = state.renewsAt;
  if (state.customerPortalUrl !== undefined)
    patch.customerPortalUrl = state.customerPortalUrl;

  await db.collection("users").doc(uid).set(patch, { merge: true });
}

export async function getSubscriptionId(
  uid: string,
): Promise<string | null> {
  const snap = await db.collection("users").doc(uid).get();
  return (snap.data()?.subscriptionId as string | undefined) ?? null;
}

export interface SubscriptionGrantResult {
  duplicate: boolean;
  granted: number;
  newBalance: number;
}

/**
 * Grants subscription credits to a user — atomic and idempotent.
 *
 * `eventId` is the dedupe key (the Lemon Squeezy invoice ID). It becomes
 * the doc ID under `lemonsqueezyEvents`; a redelivered webhook finds the
 * doc and no-ops. The rollover cap is applied against the LIVE balance
 * inside the transaction, so the grant tops up to `monthlyCredits`
 * without ever pushing the balance past `rolloverCap`.
 */
export async function applySubscriptionCredits(args: {
  uid: string;
  monthlyCredits: number;
  rolloverCap: number | null;
  eventId: string;
  reason: string;
}): Promise<SubscriptionGrantResult> {
  const eventRef = db.collection("lemonsqueezyEvents").doc(args.eventId);
  const userRef = db.collection("users").doc(args.uid);

  return db.runTransaction(async (tx) => {
    const [eventSnap, userSnap] = await Promise.all([
      tx.get(eventRef),
      tx.get(userRef),
    ]);

    const currentBalance =
      (userSnap.data()?.creditsBalance as number | undefined) ?? 0;

    if (eventSnap.exists) {
      return { duplicate: true, granted: 0, newBalance: currentBalance };
    }
    if (!userSnap.exists) {
      throw new Error(
        `User ${args.uid} not found while processing event ${args.eventId}.`,
      );
    }

    const uncapped = currentBalance + args.monthlyCredits;
    const capped =
      args.rolloverCap == null
        ? uncapped
        : Math.min(uncapped, args.rolloverCap);
    const credits = Math.max(0, capped - currentBalance);
    const now = FieldValue.serverTimestamp();
    const after = currentBalance + credits;

    tx.set(eventRef, {
      uid: args.uid,
      credits,
      processedAt: now,
    });

    if (credits > 0) {
      tx.update(userRef, { creditsBalance: after, updatedAt: now });
      tx.set(userRef.collection("credits").doc(), {
        delta: credits,
        balanceAfter: after,
        reason: args.reason,
        refKind: "purchase",
        refId: args.eventId,
        createdByUid: null,
        createdByEmail: null,
        createdAt: now,
      });
    }

    return { duplicate: false, granted: credits, newBalance: after };
  });
}
