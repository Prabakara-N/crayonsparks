export const FEEDBACK_KINDS = [
  "bug",
  "feedback",
  "feature",
  "question",
] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

export const FEEDBACK_KIND_LABELS: Record<FeedbackKind, string> = {
  bug: "Bug",
  feedback: "Feedback",
  feature: "Feature request",
  question: "Question",
};

export const FEEDBACK_STATUSES = [
  "open",
  "in_progress",
  "resolved",
] as const;

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};
