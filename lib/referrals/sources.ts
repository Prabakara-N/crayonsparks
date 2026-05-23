export interface ReferralSourceMeta {
  id: ReferralSource;
  label: string;
}

const SOURCE_IDS = [
  "google",
  "youtube",
  "pinterest",
  "reddit",
  "tiktok",
  "twitter",
  "instagram",
  "linkedin",
  "friend",
  "blog",
  "other",
  "skipped",
] as const;

export type ReferralSource = (typeof SOURCE_IDS)[number];

export const REFERRAL_SOURCES: readonly ReferralSourceMeta[] = [
  { id: "google", label: "Google search" },
  { id: "youtube", label: "YouTube" },
  { id: "pinterest", label: "Pinterest" },
  { id: "reddit", label: "Reddit" },
  { id: "tiktok", label: "TikTok" },
  { id: "twitter", label: "Twitter / X" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "friend", label: "Friend or colleague" },
  { id: "blog", label: "Blog or article" },
  { id: "other", label: "Other" },
];

export const REFERRAL_SOURCE_SET: ReadonlySet<ReferralSource> = new Set(
  SOURCE_IDS,
);

export function isReferralSource(value: unknown): value is ReferralSource {
  return typeof value === "string" && (REFERRAL_SOURCE_SET as Set<string>).has(value);
}

export function getReferralSourceLabel(id: string): string {
  if (id === "skipped") return "Skipped";
  return REFERRAL_SOURCES.find((s) => s.id === id)?.label ?? id;
}
