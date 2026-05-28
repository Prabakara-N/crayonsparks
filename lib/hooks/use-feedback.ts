"use client";

import { useCallback } from "react";
import { orpc } from "@/lib/orpc/client";
import type { FeedbackKind, FeedbackStatus } from "@/lib/feedback/types";

interface SubmitFeedbackInput {
  kind: FeedbackKind;
  title: string;
  body: string;
  page?: string;
  userAgent?: string;
  screenshotBase64?: string;
  source?: "widget" | "post-book-survey";
  bookKind?: "coloring" | "story";
}

type SurveyKind = "coloring" | "story";

type FeedbackStatusFilter = "all" | FeedbackStatus;
type FeedbackKindFilter = "all" | FeedbackKind;

interface UpdateFeedbackInput {
  id: string;
  status?: FeedbackStatus;
  adminNotes?: string;
}

export function useFeedback() {
  return {
    submit: useCallback(
      (input: SubmitFeedbackInput) => orpc.feedback.submit(input),
      [],
    ),
    listAdmin: useCallback(
      (params: {
        status?: FeedbackStatusFilter;
        kind?: FeedbackKindFilter;
        limit?: number;
      }) =>
        orpc.admin.feedback.list({
          status: params.status ?? "all",
          kind: params.kind ?? "all",
          limit: params.limit ?? 100,
        }),
      [],
    ),
    getAdmin: useCallback(
      (id: string) => orpc.admin.feedback.get({ id }),
      [],
    ),
    updateAdmin: useCallback(
      (input: UpdateFeedbackInput) => orpc.admin.feedback.update(input),
      [],
    ),
    getSurveyState: useCallback(
      (kind: SurveyKind) => orpc.feedback.getSurveyState({ kind }),
      [],
    ),
    markSurveyShown: useCallback(
      (kind: SurveyKind) => orpc.feedback.markSurveyShown({ kind }),
      [],
    ),
    skipSurvey: useCallback(
      (kind: SurveyKind) => orpc.feedback.skipSurvey({ kind }),
      [],
    ),
  };
}
