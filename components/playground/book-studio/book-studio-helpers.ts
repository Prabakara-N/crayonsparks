import type {
  RefineBookContextProp,
  RefineContext,
} from "@/components/generate/image-refine-modal/image-refine-modal-main";
import type { PageMeta, PageStatus } from "@/lib/refine-chat";
import type { ListingPlatform, PlatformStatus } from "@/lib/kdp-metadata";
import { AGE_LABELS, NOUN_OVERLAP_STOPWORDS } from "./book-studio-constants";
import type { AgeRange, Plan, PromptItem } from "./types";

// True for fetch rejections caused by user-triggered AbortController.abort().
export function isAbortError(e: unknown): boolean {
  return (
    (e instanceof DOMException && e.name === "AbortError") ||
    (e instanceof Error &&
      (e.name === "AbortError" || /aborted|signal/i.test(e.message)))
  );
}

export function initListingStatus(): Record<ListingPlatform, PlatformStatus> {
  return {
    kdp: "pending",
    etsy: "pending",
    gumroad: "pending",
    pinterest: "pending",
    instagram: "pending",
    twitter: "pending",
  };
}

export function extractKeyNouns(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !NOUN_OVERLAP_STOPWORDS.has(w)),
  );
}

export function shareKeyNoun(a: string, b: string): boolean {
  const aSet = extractKeyNouns(a);
  if (aSet.size === 0) return false;
  for (const w of extractKeyNouns(b)) if (aSet.has(w)) return true;
  return false;
}

export function statusToPageStatus(
  s: "pending" | "queued" | "generating" | "done" | "error",
): PageStatus {
  return s;
}

export function clipWords(text: string, maxWords: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const firstSentence = cleaned.split(/[.!?](\s|$)/)[0]?.trim() || cleaned;
  const words = firstSentence.split(/\s+/);
  if (words.length <= maxWords) return firstSentence;
  return `${words.slice(0, maxWords - 2).join(" ")}…`;
}

// Story back covers print ONE tagline (parent-facing prose, hard cap 22
// words). The story-book planner now emits `plan.backCoverTagline`
// directly — clean human-readable copy with no character descriptor
// parentheticals. We trust it when present.
//
// Fallbacks (legacy chat-handoff and edge cases):
//   - plan.description: usually fine for chat-mode stories, but briefToPlan
//     fills it with a placeholder ("20-page picture book.") so we filter
//     that out.
//   - plan.title: short but at least it's clean prose.
//   - DELIBERATELY do NOT fall back to plan.coverScene — that field carries
//     locked-character descriptors with parentheticals like "(small)" that
//     get rendered as visible text on the back cover (the bug we just fixed).
export function deriveStoryBackCoverTagline(plan: Plan): string {
  const direct = plan.backCoverTagline?.trim();
  if (direct) return clipWords(direct, 22);
  const desc = plan.description?.trim() ?? "";
  if (desc && !/^\d+\s*-?\s*page picture book/i.test(desc)) {
    return clipWords(desc, 22);
  }
  const title = plan.title?.trim();
  if (title) return clipWords(title, 22);
  return "An illustrated story for quiet afternoons together.";
}

export function buildRefineBookContext(args: {
  plan: Plan;
  items: PromptItem[];
  cover: {
    status: "pending" | "generating" | "done" | "error";
    dataUrl?: string;
  };
  backCover: {
    status: "pending" | "generating" | "done" | "error";
    dataUrl?: string;
  };
  age: AgeRange;
  target: {
    context: RefineContext;
    id: string;
    title?: string;
  };
}): RefineBookContextProp {
  const pages: PageMeta[] = args.items.map((it, i) => ({
    id: it.id,
    index: i + 1,
    name: it.name,
    subject: it.subject,
    status: statusToPageStatus(it.status),
  }));
  const targetSubject =
    args.target.context === "cover"
      ? args.plan.coverScene
      : args.target.context === "back-cover"
        ? args.plan.description
        : args.items.find((it) => it.id === args.target.id)?.subject;
  const targetLabel =
    args.target.context === "cover"
      ? "Front cover"
      : args.target.context === "back-cover"
        ? "Back cover"
        : args.target.title ?? `Page ${pages.findIndex((p) => p.id === args.target.id) + 1}`;
  return {
    bookTitle: args.plan.coverTitle ?? args.plan.title,
    bookScene: args.plan.scene,
    audience: AGE_LABELS[args.age],
    targetId: args.target.id || args.target.context,
    targetLabel,
    targetSubject,
    pages,
    coverStatus: args.cover.status,
    backCoverStatus: args.backCover.status,
    palette: args.plan.palette,
  };
}
