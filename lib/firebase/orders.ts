import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin";

export interface PurchaseResult {
  duplicate: boolean;
  newBalance: number;
}

/**
 * Credits a paid order to a user — atomically and idempotently.
 *
 * The Lemon Squeezy order ID is the doc ID in `lemonsqueezyOrders`. The
 * whole thing runs in ONE transaction: if the order doc already exists
 * the webhook is a retry and we no-op; otherwise we create the order
 * marker, bump the balance, and append the `purchase` ledger entry
 * together. A webhook redelivery can never double-grant.
 */
export async function applyPurchaseCredits(args: {
  uid: string;
  credits: number;
  orderId: string;
  packId: string;
  reason: string;
}): Promise<PurchaseResult> {
  const orderRef = db.collection("lemonsqueezyOrders").doc(args.orderId);
  const userRef = db.collection("users").doc(args.uid);

  return db.runTransaction(async (tx) => {
    const [orderSnap, userSnap] = await Promise.all([
      tx.get(orderRef),
      tx.get(userRef),
    ]);

    const currentBalance =
      (userSnap.data()?.creditsBalance as number | undefined) ?? 0;

    if (orderSnap.exists) {
      return { duplicate: true, newBalance: currentBalance };
    }
    if (!userSnap.exists) {
      throw new Error(
        `User ${args.uid} not found while processing order ${args.orderId}.`,
      );
    }

    const after = currentBalance + args.credits;
    const now = FieldValue.serverTimestamp();

    tx.set(orderRef, {
      uid: args.uid,
      packId: args.packId,
      credits: args.credits,
      processedAt: now,
    });
    tx.update(userRef, { creditsBalance: after, updatedAt: now });
    tx.set(userRef.collection("credits").doc(), {
      delta: args.credits,
      balanceAfter: after,
      reason: args.reason,
      refKind: "purchase",
      refId: args.orderId,
      createdByUid: null,
      createdByEmail: null,
      createdAt: now,
    });

    return { duplicate: false, newBalance: after };
  });
}
