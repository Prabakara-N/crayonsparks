import "server-only";

import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";

export type SurveyBookKind = "coloring" | "story";

const MAX_SKIPS = 3;

interface SurveyEntry {
  shownCount?: number;
  skipCount?: number;
  completedAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface SurveyState {
  shownCount: number;
  skipCount: number;
  completed: boolean;
  shouldShow: boolean;
}

async function readSurvey(
  userId: string,
  kind: SurveyBookKind,
): Promise<SurveyEntry> {
  const snap = await db
    .collection("users")
    .doc(userId)
    .collection("feedbackSurvey")
    .doc(kind)
    .get();
  return (snap.data() ?? {}) as SurveyEntry;
}

export async function getSurveyState(
  userId: string,
  kind: SurveyBookKind,
): Promise<SurveyState> {
  const entry = await readSurvey(userId, kind);
  const completed = !!entry.completedAt;
  const skipCount = entry.skipCount ?? 0;
  const shownCount = entry.shownCount ?? 0;
  return {
    shownCount,
    skipCount,
    completed,
    shouldShow: !completed && skipCount < MAX_SKIPS,
  };
}

export async function markSurveyShown(
  userId: string,
  kind: SurveyBookKind,
): Promise<void> {
  const ref = db
    .collection("users")
    .doc(userId)
    .collection("feedbackSurvey")
    .doc(kind);
  await ref.set(
    {
      shownCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function markSurveySkipped(
  userId: string,
  kind: SurveyBookKind,
): Promise<SurveyState> {
  const ref = db
    .collection("users")
    .doc(userId)
    .collection("feedbackSurvey")
    .doc(kind);
  await ref.set(
    {
      skipCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return getSurveyState(userId, kind);
}

export async function markSurveyCompleted(
  userId: string,
  kind: SurveyBookKind,
): Promise<void> {
  const ref = db
    .collection("users")
    .doc(userId)
    .collection("feedbackSurvey")
    .doc(kind);
  await ref.set(
    {
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
