import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin";

export type CreditRefKind =
  | "signup"
  | "grant"
  | "purchase"
  | "spend"
  | "refund";

export interface LedgerEntry {
  id: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  refKind: CreditRefKind;
  refId: string | null;
  createdByEmail: string | null;
  createdAt: number | null;
}

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly current: number,
    public readonly needed: number,
  ) {
    super(
      `Insufficient credits — have ${current}, need ${needed}.`,
    );
    this.name = "InsufficientCreditsError";
  }
}

export async function getCreditBalance(uid: string): Promise<number> {
  const snap = await db.collection("users").doc(uid).get();
  return (snap.data()?.creditsBalance as number | undefined) ?? 0;
}

interface ApplyCreditChangeArgs {
  uid: string;
  /** Positive grants, negative spends. */
  delta: number;
  reason: string;
  refKind: CreditRefKind;
  refId?: string | null;
  createdByUid?: string | null;
  createdByEmail?: string | null;
}

/**
 * Atomically adjusts a user's credit balance and appends a ledger entry,
 * inside a single Firestore transaction. Throws InsufficientCreditsError
 * if the change would push the balance below zero.
 */
export async function applyCreditChange(
  args: ApplyCreditChangeArgs,
): Promise<number> {
  const userRef = db.collection("users").doc(args.uid);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) {
      throw new Error("User not found.");
    }
    const current = (snap.data()?.creditsBalance as number | undefined) ?? 0;
    const after = current + args.delta;
    if (after < 0) {
      throw new InsufficientCreditsError(current, Math.abs(args.delta));
    }
    tx.update(userRef, {
      creditsBalance: after,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(userRef.collection("credits").doc(), {
      delta: args.delta,
      balanceAfter: after,
      reason: args.reason,
      refKind: args.refKind,
      refId: args.refId ?? null,
      createdByUid: args.createdByUid ?? null,
      createdByEmail: args.createdByEmail ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
    return after;
  });
}

/** Spend credits. Throws InsufficientCreditsError if the balance is too low. */
export async function deductCredits(
  uid: string,
  amount: number,
  reason: string,
  refId?: string,
): Promise<number> {
  return applyCreditChange({
    uid,
    delta: -Math.abs(amount),
    reason,
    refKind: "spend",
    refId,
  });
}

/** Grant credits (admin grant, signup bonus, purchase, refund). */
export async function grantCredits(
  uid: string,
  amount: number,
  reason: string,
  opts: {
    refKind?: Exclude<CreditRefKind, "spend">;
    refId?: string;
    createdByUid?: string;
    createdByEmail?: string;
  } = {},
): Promise<number> {
  return applyCreditChange({
    uid,
    delta: Math.abs(amount),
    reason,
    refKind: opts.refKind ?? "grant",
    refId: opts.refId,
    createdByUid: opts.createdByUid,
    createdByEmail: opts.createdByEmail,
  });
}

/** Admin "grant or revoke" — allows a negative delta. */
export async function adjustCredits(args: {
  uid: string;
  delta: number;
  reason: string;
  createdByUid: string;
  createdByEmail: string | null;
}): Promise<number> {
  return applyCreditChange({
    uid: args.uid,
    delta: args.delta,
    reason: args.reason,
    refKind: "grant",
    createdByUid: args.createdByUid,
    createdByEmail: args.createdByEmail,
  });
}

export async function listCreditLedger(
  uid: string,
  limit = 50,
): Promise<LedgerEntry[]> {
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("credits")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      delta: (data.delta as number) ?? 0,
      balanceAfter: (data.balanceAfter as number | null) ?? 0,
      reason: (data.reason as string) ?? "",
      refKind: (data.refKind as CreditRefKind) ?? "grant",
      refId: (data.refId as string | null) ?? null,
      createdByEmail: (data.createdByEmail as string | null) ?? null,
      createdAt: data.createdAt?.toMillis() ?? null,
    };
  });
}
