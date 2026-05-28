import "server-only";

import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { db } from "./admin";
import { SIGNUP_FREE_CREDITS } from "@/lib/credits/costs";
import { sendWelcomeEmail } from "@/lib/email/send-welcome-email";

export interface UserProfileSnapshot {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  creditsBalance: number;
  plan: string;
  signInProvider: string | null;
  referralSource: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  lastSignInAt: Timestamp | null;
}

interface EnsureUserInput {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  signInProvider?: string | null;
}

export async function ensureUserDocument(
  input: EnsureUserInput,
): Promise<UserProfileSnapshot> {
  const ref = db.collection("users").doc(input.uid);
  const snap = await ref.get();
  const now = FieldValue.serverTimestamp();

  if (!snap.exists) {
    // New account — seed the Free-tier signup bonus + its ledger entry.
    const batch = db.batch();
    batch.set(ref, {
      uid: input.uid,
      email: input.email,
      displayName: input.displayName ?? null,
      photoURL: input.photoURL ?? null,
      creditsBalance: SIGNUP_FREE_CREDITS,
      plan: "free",
      signInProvider: input.signInProvider ?? null,
      createdAt: now,
      updatedAt: now,
      lastSignInAt: now,
      welcomedAt: now,
    });
    batch.set(ref.collection("credits").doc(), {
      delta: SIGNUP_FREE_CREDITS,
      balanceAfter: SIGNUP_FREE_CREDITS,
      reason: "Welcome bonus — free credits for new accounts.",
      refKind: "signup",
      refId: null,
      createdByUid: null,
      createdByEmail: null,
      createdAt: now,
    });
    await batch.commit();

    if (input.email) {
      const firstName = input.displayName?.trim().split(/\s+/)[0] ?? null;
      sendWelcomeEmail({ to: input.email, firstName }).then((result) => {
        if (!result.ok) {
          console.warn("[users] welcome email send failed:", result.error);
        }
      });
    }
  } else {
    await ref.set(
      {
        email: input.email,
        displayName: input.displayName ?? null,
        photoURL: input.photoURL ?? null,
        signInProvider: input.signInProvider ?? null,
        updatedAt: now,
        lastSignInAt: now,
      },
      { merge: true },
    );
  }

  const after = await ref.get();
  const data = after.data() ?? {};
  return {
    uid: input.uid,
    email: (data.email as string | null) ?? null,
    displayName: (data.displayName as string | null) ?? null,
    photoURL: (data.photoURL as string | null) ?? null,
    creditsBalance: (data.creditsBalance as number | undefined) ?? 0,
    plan: (data.plan as string | undefined) ?? "free",
    signInProvider: (data.signInProvider as string | null) ?? null,
    referralSource: (data.referralSource as string | null) ?? null,
    createdAt: (data.createdAt as Timestamp | undefined) ?? null,
    updatedAt: (data.updatedAt as Timestamp | undefined) ?? null,
    lastSignInAt: (data.lastSignInAt as Timestamp | undefined) ?? null,
  };
}

interface SetReferralSourceArgs {
  uid: string;
  source: string;
  other?: string | null;
}

export async function setReferralSource(
  args: SetReferralSourceArgs,
): Promise<void> {
  await db
    .collection("users")
    .doc(args.uid)
    .set(
      {
        referralSource: args.source,
        referralSourceOther: args.other?.trim() || null,
        referralSourceAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

export interface BillingSummary {
  planId: string;
  creditsBalance: number;
  subscriptionStatus: string | null;
  subscriptionRenewsAt: string | null;
  customerPortalUrl: string | null;
}

export async function getBillingSummary(
  uid: string,
): Promise<BillingSummary> {
  const snap = await db.collection("users").doc(uid).get();
  const data = snap.data() ?? {};
  return {
    planId: (data.plan as string | undefined) ?? "free",
    creditsBalance: (data.creditsBalance as number | undefined) ?? 0,
    subscriptionStatus:
      (data.subscriptionStatus as string | undefined) ?? null,
    subscriptionRenewsAt:
      (data.subscriptionRenewsAt as string | undefined) ?? null,
    customerPortalUrl:
      (data.customerPortalUrl as string | undefined) ?? null,
  };
}
