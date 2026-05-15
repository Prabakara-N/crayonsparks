"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  BookPlus,
  BookOpen,
  GalleryHorizontal,
  Play,
  Pause,
  Square,
  RefreshCw,
  Plus,
  Lightbulb,
} from "lucide-react";
import { prefetchBookFlip, BookFlip } from "@/components/playground/book-flip";
import { ReferenceImageField } from "@/components/ui/reference-image-field";
import {
  ImageRefineModal,
  type RefineContext,
} from "@/components/generate/image-refine-modal/image-refine-modal";
import { MockupGenerator } from "@/components/ui/mockup-generator";
import { MockupGate } from "@/components/ui/mockup-gate";
import { useDialog } from "@/components/ui/confirm-dialog";
import { ImagePreviewDialog } from "@/components/ui/image-preview-dialog";
import { useNavigationGuard } from "@/lib/use-navigation-guard";
import { DownloadMenu } from "@/components/playground/download-menu";
import { KdpMetadataPanel } from "@/components/playground/kdp-metadata/kdp-metadata-panel";
import { CoverPair } from "@/components/playground/cover-pair";
import { ModelPicker } from "@/components/playground/model-picker";
import { PlanReviewButton } from "@/components/playground/plan-review-panel/plan-review-panel";
import type {
  ListingDraft,
  ListingPlatform,
  PlatformStatus,
} from "@/lib/kdp-metadata";
import { type StoryType } from "@/lib/story-book-planner";
import type { DialogueStyle } from "@/lib/prompts";
import {
  COVER_MODEL_OPTIONS,
  INTERIOR_MODEL_OPTIONS,
  DEFAULT_COVER_MODEL,
  DEFAULT_INTERIOR_MODEL,
  type ImageModel,
} from "@/lib/constants";
import type {
  AgeRange,
  Aspect,
  CoverBorder,
  CoverStyle,
  DetailLevel,
  Phase,
  Plan,
  PromptItem,
  QualityScore,
} from "./types";
import {
  AGE_LABELS,
  LISTING_PLATFORMS,
} from "./book-studio-constants";
import {
  buildRefineBookContext,
  deriveStoryBackCoverTagline,
  initListingStatus,
  isAbortError,
  shareKeyNoun,
} from "./book-studio-helpers";
import { IdeaForm } from "./idea-form";
import { Carousel } from "./carousel";

export type {
  StoryDialogueLine,
  StoryCharacter,
  StoryPalette,
  Plan,
} from "./types";

export function BookStudio({
  initialPlan,
  initialAge,
  initialReference,
  initialMode,
  onSwitchToChat,
  onReset,
}: {
  /**
   * If provided, BookStudio skips the "describe your book" idea phase and
   * lands directly in the review phase with this plan loaded. Used by the
   * playground chat → bulk-book inline handoff so users don't lose their
   * AI-generated brief.
   */
  initialPlan?: Plan;
  initialAge?: AgeRange;
  /**
   * Reference image dataUrl forwarded from the chat → bulk handoff. When
   * present, BookStudio pre-loads it as the page-generation reference so
   * Sparky's reference-led prompt path runs out of the box.
   */
  initialReference?: string;
  /**
   * Chat origin — determines whether style-chaining runs by default.
   * Story mode has recurring characters/world → chain ON. Q&A mode has
   * unrelated subjects per page → chain OFF, with a noun-overlap fallback
   * that turns it back ON when two pages share a key noun (e.g. both
   * mention "lion" in a "20 different lions" Q&A book).
   */
  initialMode?: "qa" | "story";
  /**
   * Hands the typed idea text up to the playground shell so it can switch
   * to the Sparky AI tab pre-set to the matching chat mode with the idea
   * pre-filled. Used by the IdeaForm "Plan with Sparky AI" link in BOTH
   * Coloring book mode (mode="qa") and Story book mode (mode="story") so
   * users who prefer chat-based planning can switch from either flow.
   */
  onSwitchToChat?: (idea: string, mode: "qa" | "story") => void;
  /** Notifies the parent shell when the user clicks "Start new book" so the shell can drop any Sparky-seeded plan / reference / mode. */
  onReset?: () => void;
} = {}) {
  const dialog = useDialog();
  const [phase, setPhase] = useState<Phase>(initialPlan ? "review" : "idea");
  // Block in-app link clicks, browser back, and tab close while a bulk
  // run is mid-flight — losing it would forfeit ~3 minutes of generation
  // and any partially-generated pages.
  useNavigationGuard(phase === "generating", () =>
    dialog.confirm({
      title: "Leave while generating?",
      message:
        "Pages are still being generated. Leaving now will stop the run and any unfinished pages will be lost. Generated pages so far will be kept if you come back.",
      confirmText: "Leave anyway",
      cancelText: "Keep generating",
      variant: "danger",
    }),
  );
  const [idea, setIdea] = useState("");
  const [pageCount, setPageCount] = useState(initialPlan?.prompts.length ?? 20);
  const [age, setAge] = useState<AgeRange>(initialAge ?? "toddlers");
  // Default to Low ("simple") — character + a few balanced supporting
  // elements is the most common ask. Low / High are explicit user choices.
  const [detailLevel, setDetailLevel] = useState<DetailLevel>(
    initialPlan?.detailLevel ?? "simple",
  );
  const [aspectRatio, setAspectRatio] = useState<Aspect>("3:4");
  const [reference, setReference] = useState<string | null>(
    initialReference ?? null,
  );
  // Default to "qa" when no chat mode is provided (manual idea → plan path).
  // Q&A is the safer default because it suppresses chaining unless a noun
  // overlap proves recurring characters; Story would force chaining on
  // unrelated subjects. The manual story-book planner flips this to
  // "story" inside runPlan() so the downstream fetch sites all use the
  // story endpoints.
  const [mode, setMode] = useState<"qa" | "story">(initialMode ?? "qa");

  // Toggle on the IdeaForm — only matters for the manual idea-form path
  // (mode is already set when arriving from the chat). When story is
  // picked, the form shows two extra inputs (story type + character
  // names) and runPlan() branches to /api/plan-story-book. Sparky AI
  // chat remains available as a secondary "advanced multi-turn planning"
  // link for users who want it.
  const [bookKind, setBookKind] = useState<"coloring" | "story">("coloring");

  // Story-mode IdeaForm fields. Coloring mode ignores all three. Story
  // type is OPTIONAL (planner falls back to canonical plot for known
  // fables or the most natural shape for originals). Dialogue style
  // defaults to "balanced" — the planner emits ~50% bubble pages. Both
  // seed from a Sparky-handoff plan when present so the picks the user
  // made in chat carry over to the bulk-book form.
  const [storyType, setStoryType] = useState<StoryType | null>(
    initialPlan?.storyType ?? null,
  );
  const [storyCharacterNames, setStoryCharacterNames] = useState<string>("");
  const [dialogueStyle, setDialogueStyle] = useState<DialogueStyle>(
    initialPlan?.dialogueStyle ?? "balanced",
  );

  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(initialPlan ?? null);

  const [items, setItems] = useState<PromptItem[]>(
    initialPlan
      ? initialPlan.prompts.map((p, i) => ({
        id: `seed.${String(i + 1).padStart(2, "0")}`,
        name: p.name,
        subject: p.subject,
        status: "pending" as const,
        dialogue: p.dialogue,
        narration: p.narration,
        composition: p.composition,
      }))
      : [],
  );
  const [cover, setCover] = useState<{
    status: "pending" | "generating" | "done" | "error";
    dataUrl?: string;
    error?: string;
    quality?: QualityScore | null;
    /** Model that produced the current dataUrl. Refines inherit this. */
    model?: ImageModel;
  }>({
    status: "pending",
  });
  const [coverStyle, setCoverStyle] = useState<CoverStyle>("illustrated");
  const [coverBorder, setCoverBorder] = useState<CoverBorder>("bleed");
  const [coverBadgeStyle, setCoverBadgeStyle] = useState<string>(
    initialPlan?.coverBadgeStyle ?? "",
  );
  const seededBadgeStyleForPlanRef = useRef<Plan | null>(initialPlan ?? null);

  useEffect(() => {
    if (!plan) return;
    if (seededBadgeStyleForPlanRef.current === plan) return;
    seededBadgeStyleForPlanRef.current = plan;
    setCoverBadgeStyle(plan.coverBadgeStyle ?? "");
  }, [plan]);
  // Image model used for the FRONT + BACK cover. Defaults to Nano Banana Pro
  // because the Amazon thumbnail is the highest-leverage pixel we ship.
  const [coverModel, setCoverModel] =
    useState<ImageModel>(DEFAULT_COVER_MODEL);
  // Image model used for INTERIOR pages + the "this book belongs to"
  // page. Defaults to the cheaper Nano Banana 3.1 Flash because a single
  // book can render dozens of pages and Pro pricing would dominate cost.
  const [interiorModel, setInteriorModel] =
    useState<ImageModel>(DEFAULT_INTERIOR_MODEL);
  const [backCover, setBackCover] = useState<{
    status: "pending" | "generating" | "done" | "error";
    dataUrl?: string;
    error?: string;
    quality?: QualityScore | null;
    model?: ImageModel;
  }>({ status: "pending" });
  // "This Book Belongs To" page — auto-generated right after the front
  // cover succeeds. Style toggle in the IdeaForm picks bw (kid colors it)
  // or color (parent fills the name in pen). Position in the PDF is
  // page 2 (between the cover and the first content page).
  const [belongsTo, setBelongsTo] = useState<{
    status: "pending" | "generating" | "done" | "error";
    dataUrl?: string;
    error?: string;
    quality?: QualityScore | null;
    model?: ImageModel;
  }>({ status: "pending" });
  const [belongsToStyle, setBelongsToStyle] = useState<"bw" | "color">("bw");
  // Character lock — extracted once from the front cover by the OpenAI vision model
  // and injected into every subsequent page-generation prompt so recurring
  // characters stay visually identical across all 20 pages (same body
  // shape, same proportions, same distinguishing features). Without this
  // Gemini drifts (cover: fat tabby cat → page 7: skinny orange cat) and
  // KDP reviewers reject the book.
  const [characterLock, setCharacterLock] = useState<{
    status: "pending" | "extracting" | "done" | "error";
    block?: string;
    error?: string;
  }>({ status: "pending" });
  // Bulk-flow quality check is OFF by default and hidden from the UI.
  // The vision rater is still wired into the API route — kept available for
  // the refine flow where the user explicitly opts in. We never trigger
  // regeneration based on the score, so a low rating just surfaces a hint
  // on the regenerate button; it does NOT auto-rerun anything.
  const [qualityCheck] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pdfBuilding, setPdfBuilding] = useState(false);

  const pausedRef = useRef(false);
  const cancelRef = useRef(false);
  const runningRef = useRef(false);
  // AbortController fed into every /api/generate fetch — pause() and
  // cancel() trigger .abort() so the in-flight request stops mid-flight
  // (without this, pause only kicks in BETWEEN pages, which is what the
  // user was hitting on Page 13/17).
  const abortRef = useRef<AbortController | null>(null);

  // Live snapshot of the items array so the bulk-generate loop reads
  // up-to-date statuses on each iteration. Without this the loop's
  // closure-captured `items` stays frozen at the moment startGeneration
  // ran — so a page manually regenerated mid-loop still reads as pending
  // when the loop reaches it, and the loop re-runs the same page.
  const itemsRef = useRef<PromptItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  });


  // Story-mode image preview — when a user clicks "refine" on any story
  // image (cover, back cover, or interior page), we open this lightbox
  // instead of the coloring-book refine chat. Refine-as-edit is a follow-up;
  // for now we let users see the image at full resolution with a tiny
  // "refine coming soon" caption.
  const [storyPreview, setStoryPreview] = useState<{
    open: boolean;
    src: string;
    label: string;
  }>({ open: false, src: "", label: "" });

  const openStoryPreview = useCallback((src: string, label: string) => {
    if (!src) return;
    setStoryPreview({ open: true, src, label });
  }, []);

  // refine modal
  const [refine, setRefine] = useState<{
    open: boolean;
    context: RefineContext;
    /** Stable id of the thing being refined — "cover" / "back-cover" / item.id. */
    targetId: string;
    dataUrl?: string;
    title?: string;
    subtitle?: string;
    downloadName?: string;
    onRefined?: (dataUrl: string) => void;
    quality?: QualityScore | null;
    /**
     * Model the source image was produced with — forwarded to the modal so
     * /api/refine stays on the same model. Falls back to the live dropdown
     * for legacy items that pre-date model tagging.
     */
    model?: ImageModel;
  }>({ open: false, context: "page", targetId: "" });

  // Per-target background-refine status. Populated when the user closes the
  // modal mid-fetch (status = "running") and updated to "done" when the
  // request resolves. Cards read from this map to surface a "refine in
  // process" / "refine done" pill so the user knows their close didn't
  // cancel the work. "done" entries auto-clear after a short delay below.
  const [refineStatus, setRefineStatus] = useState<
    Record<string, "running" | "done">
  >({});
  // Counter that increments every time the user "opens" a refine. Lets the
  // modal detect a fresh open-request even when `open` was already true —
  // user clicks page card while refine is running in background, modal
  // wakes up with the live chat + in-flight fetch still attached.
  const [refineOpenNonce, setRefineOpenNonce] = useState(0);
  const openRefine = useCallback(
    (next: {
      context: RefineContext;
      targetId: string;
      dataUrl?: string;
      title?: string;
      subtitle?: string;
      downloadName?: string;
      onRefined?: (dataUrl: string) => void;
      quality?: QualityScore | null;
      model?: ImageModel;
    }) => {
      setRefineOpenNonce((n) => n + 1);
      setRefine({ ...next, open: true });
    },
    [],
  );

  // Toggle: carousel grid vs inline page-flip book preview
  const [viewMode, setViewMode] = useState<"carousel" | "book">("carousel");

  // Pre-fetch the react-pageflip chunk on mount so the first "Book preview"
  // click doesn't trigger a dynamic-import flash + layout shift.
  useEffect(() => {
    prefetchBookFlip();
  }, []);

  // Auto-extract the character lock as soon as the cover finishes —
  // regardless of whether the cover was generated standalone (clicking the
  // cover-pair button) or as part of bulk startGeneration. Without this,
  // covers generated outside the bulk flow leave the lock stuck on
  // "pending" forever and interior pages never get the lock injection.
  // Story mode skips this — the brief already carries locked character
  // descriptors and the story-page endpoint forwards them directly to the
  // image model. Running a coloring-book vision extractor on a full-color
  // picture-book cover would produce a B&W-shaped lock that doesn't apply.
  useEffect(() => {
    if (mode === "story") return;
    if (cover.status !== "done" || !cover.dataUrl) return;
    if (characterLock.status !== "pending") return;
    void extractCharacterLock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cover.status, cover.dataUrl, characterLock.status, mode]);

  const [listingDraft, setListingDraft] = useState<ListingDraft>({});
  const [listingStatus, setListingStatus] = useState<
    Record<ListingPlatform, PlatformStatus>
  >(() => initListingStatus());
  const [listingErrors, setListingErrors] = useState<
    Partial<Record<ListingPlatform, string>>
  >({});
  const generateMetadata = useCallback(
    async (only?: ListingPlatform) => {
      if (!plan) return;
      const isStory = mode === "story";
      const body = {
        bookTitle: plan.coverTitle ?? plan.title,
        scene: isStory ? plan.coverScene || plan.scene : plan.scene,
        age,
        pageCount: items.length,
        samplePages: items.slice(0, 8).map((it) => it.subject),
        kind: isStory ? "story" : "coloring",
      };
      const targets = only ? [only] : LISTING_PLATFORMS;
      setListingStatus((s) => {
        const next = { ...s };
        targets.forEach((p) => {
          next[p] = "loading";
        });
        return next;
      });
      setListingErrors((prev) => {
        const next = { ...prev };
        targets.forEach((p) => delete next[p]);
        return next;
      });
      await Promise.all(
        targets.map(async (platform) => {
          try {
            const res = await fetch(`/api/listing/${platform}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const json = (await res.json()) as {
              data?: unknown;
              error?: string;
            };
            if (!res.ok || !json.data)
              throw new Error(json.error ?? `${platform} failed`);
            setListingDraft((d) => ({ ...d, [platform]: json.data }));
            setListingStatus((s) => ({ ...s, [platform]: "done" }));
          } catch (e) {
            setListingStatus((s) => ({ ...s, [platform]: "error" }));
            setListingErrors((prev) => ({
              ...prev,
              [platform]: e instanceof Error ? e.message : `${platform} failed`,
            }));
          }
        }),
      );
    },
    [plan, mode, age, items],
  );

  const runPlan = useCallback(async () => {
    const trimmed = idea.trim();
    if (trimmed.length < 10) {
      setPlanError(
        bookKind === "story"
          ? "Describe the story in at least 10 characters."
          : "Describe the book in at least 10 characters.",
      );
      return;
    }
    setPlanError(null);
    setPlanning(true);
    setPhase("planning");
    try {
      const isStoryPlan = bookKind === "story";
      const endpoint = isStoryPlan
        ? "/api/plan-story-book"
        : "/api/plan-book";
      const body = isStoryPlan
        ? {
          idea: trimmed,
          pageCount,
          age,
          storyType: storyType ?? undefined,
          characterNames: storyCharacterNames.trim() || undefined,
          dialogueStyle,
        }
        : { idea: trimmed, pageCount, age };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { plan?: Plan; error?: string };
      if (!res.ok || !json.plan) throw new Error(json.error || "Planning failed");
      // Flip the runtime mode so the downstream cover/back-cover/page/PDF
      // fetches route to the story endpoints.
      setMode(isStoryPlan ? "story" : "qa");
      setPlan(json.plan);
      setItems(
        json.plan.prompts.map((p, i) => ({
          id: `p${String(i + 1).padStart(2, "0")}`,
          name: p.name,
          subject: p.subject,
          status: "pending",
          dialogue: p.dialogue,
          narration: p.narration,
          composition: p.composition,
        }))
      );
      setCover({ status: "pending" });
      setCurrentIndex(0);
      setPhase("review");
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : "Failed to plan book");
      setPhase("idea");
    } finally {
      setPlanning(false);
    }
  }, [idea, pageCount, age]);

  const updateItem = (id: string, patch: Partial<PromptItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const updatePromptText = (id: string, patch: { name?: string; subject?: string }) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const reset = () => {
    cancelRef.current = true;
    runningRef.current = false;
    pausedRef.current = false;
    setPhase("idea");
    setPlan(null);
    setItems([]);
    setCover({ status: "pending" });
    setBackCover({ status: "pending" });
    setCurrentIndex(0);
    onReset?.();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const generateCover = useCallback(async () => {
    if (!plan) return;
    setCover({ status: "generating" });
    try {
      if (mode === "story") {
        if (!plan.characters?.length) {
          throw new Error(
            "Story brief is missing locked characters. Re-run the chat to regenerate the brief.",
          );
        }
        if (!plan.palette || plan.palette.hexes.length < 3) {
          throw new Error(
            "Story brief is missing a locked palette. Re-run the chat to regenerate the brief.",
          );
        }
        const res = await fetch("/api/generate-story-cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current?.signal,
          body: JSON.stringify({
            ageBand: age,
            title: plan.coverTitle,
            coverScene: plan.coverScene,
            characters: plan.characters,
            palette: plan.palette,
            audienceLabel: AGE_LABELS[age],
            pageCount: items.length,
            bottomStripPhrases: plan.bottomStripPhrases,
            sidePlaqueLines: plan.sidePlaqueLines,
            coverBadgeStyle: coverBadgeStyle.trim() || plan.coverBadgeStyle,
            model: coverModel,
            coverStyle,
            coverBorder,
          }),
        });
        const json = (await res.json()) as { dataUrl?: string; error?: string };
        if (!res.ok || !json.dataUrl) {
          throw new Error(json.error || "Story cover failed");
        }
        setCover({
          status: "done",
          dataUrl: json.dataUrl,
          quality: null,
          model: coverModel,
        });
        return;
      }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current?.signal,
        body: JSON.stringify({
          mode: "cover",
          coverTitle: plan.coverTitle,
          coverScene: plan.coverScene,
          coverStyle,
          coverBorder,
          pageCount: items.length,
          bottomStripPhrases: plan.bottomStripPhrases,
          sidePlaqueLines: plan.sidePlaqueLines,
          coverBadgeStyle: coverBadgeStyle.trim() || plan.coverBadgeStyle,
          // No referenceDataUrl for the FRONT cover — user feedback removed
          // it. Only the back cover uses the front cover as a style ref.
          qualityGate: qualityCheck,
          model: coverModel,
        }),
      });
      const json = (await res.json()) as {
        dataUrl?: string;
        error?: string;
        quality?: QualityScore | null;
      };
      if (!res.ok || !json.dataUrl) throw new Error(json.error || "Cover failed");
      setCover({
        status: "done",
        dataUrl: json.dataUrl,
        quality: json.quality ?? null,
        model: coverModel,
      });
    } catch (e) {
      if (isAbortError(e)) {
        setCover({ status: "pending" });
        return;
      }
      setCover({ status: "error", error: e instanceof Error ? e.message : "Cover failed" });
      throw e;
    }
  }, [
    plan,
    mode,
    age,
    coverStyle,
    coverBorder,
    coverBadgeStyle,
    items.length,
    qualityCheck,
    coverModel,
  ]);

  const generateBackCover = useCallback(async () => {
    if (!plan) return;
    if (!cover.dataUrl) {
      setBackCover({
        status: "error",
        error: "Generate the front cover first — back cover matches its style.",
      });
      return;
    }
    setBackCover({ status: "generating" });
    try {
      if (mode === "story") {
        if (!plan.palette || plan.palette.hexes.length < 3) {
          throw new Error(
            "Story brief is missing a locked palette. Re-run the chat to regenerate the brief.",
          );
        }
        const res = await fetch("/api/generate-story-back-cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current?.signal,
          body: JSON.stringify({
            ageBand: age,
            title: plan.coverTitle,
            palette: plan.palette,
            tagline: deriveStoryBackCoverTagline(plan),
            coverReferenceDataUrl: cover.dataUrl,
            model: coverModel,
          }),
        });
        const json = (await res.json()) as { dataUrl?: string; error?: string };
        if (!res.ok || !json.dataUrl) {
          throw new Error(json.error || "Story back cover failed");
        }
        setBackCover({
          status: "done",
          dataUrl: json.dataUrl,
          quality: null,
          model: coverModel,
        });
        return;
      }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current?.signal,
        body: JSON.stringify({
          mode: "back-cover",
          coverTitle: plan.coverTitle,
          coverScene: plan.coverScene,
          backCoverDescription: plan.description,
          coverStyle,
          coverBorder,
          // Pass front cover as STYLE REFERENCE so back cover matches palette/style.
          referenceDataUrl: cover.dataUrl,
          qualityGate: qualityCheck,
          model: coverModel,
        }),
      });
      const json = (await res.json()) as {
        dataUrl?: string;
        error?: string;
        quality?: QualityScore | null;
      };
      if (!res.ok || !json.dataUrl) throw new Error(json.error || "Back cover failed");
      setBackCover({
        status: "done",
        dataUrl: json.dataUrl,
        quality: json.quality ?? null,
        model: coverModel,
      });
    } catch (e) {
      if (isAbortError(e)) {
        setBackCover({ status: "pending" });
        return;
      }
      setBackCover({
        status: "error",
        error: e instanceof Error ? e.message : "Back cover failed",
      });
    }
  }, [plan, mode, cover.dataUrl, coverStyle, coverBorder, qualityCheck, coverModel]);

  // Character locker — runs ONCE per book right after the cover succeeds.
  // Reads the cover image with the OpenAI vision model and produces a
  // CHARACTER LOCK descriptor block. The block is injected into every
  // subsequent page-generation prompt so recurring characters look
  // identical across all pages. Failures are non-blocking: pages still
  // generate, but without the lock the cat may look different page-to-page.
  const extractCharacterLock = useCallback(async () => {
    if (!plan || !cover.dataUrl) return;
    setCharacterLock({ status: "extracting" });
    try {
      const res = await fetch("/api/extract-characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverDataUrl: cover.dataUrl,
          bookTitle: plan.coverTitle ?? plan.title,
        }),
      });
      const json = (await res.json()) as {
        lockBlock?: string;
        error?: string;
      };
      if (!res.ok || !json.lockBlock) {
        throw new Error(json.error || "Character extraction failed");
      }
      setCharacterLock({ status: "done", block: json.lockBlock });
    } catch (e) {
      setCharacterLock({
        status: "error",
        error: e instanceof Error ? e.message : "Character extraction failed",
      });
    }
  }, [plan, cover.dataUrl]);

  // "This Book Belongs To" page — corner cameos pull from the first 1-3
  // page subjects so the characters match the actual book contents.
  const generateBelongsToPage = useCallback(async () => {
    if (!plan) return;
    setBelongsTo({ status: "generating" });
    try {
      // Build a compact characters string from the first few page subjects.
      // The prompt template uses this as the cameo subject list.
      const characterSubjects = items
        .slice(0, 3)
        .map((it) => it.subject)
        .filter(Boolean)
        .join("; ");
      const characters =
        characterSubjects ||
        plan.coverScene ||
        "two friendly cartoon characters from the book";
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current?.signal,
        body: JSON.stringify({
          mode: "belongs-to",
          coverTitle: plan.coverTitle,
          belongsToCharacters: characters,
          belongsToStyle,
          // Belongs-to is technically interior content, so it follows the
          // interior dropdown — keeps cost predictable on bulk runs.
          model: interiorModel,
          // CHARACTER MATCHING — three reinforcing signals so the corner
          // cameos genuinely match the cover (not a "kind-of-similar cat"):
          //   (1) textual character lock extracted from the cover
          //   (2) cover image itself as visual chain reference — Gemini
          //       sees the actual colors, proportions, and pose of the
          //       characters it must replicate
          //   (3) prompt-side directive (in BELONGS_TO_PROMPT_TEMPLATE)
          //       that prefers the lock over the generic characters list
          characterLock: characterLock.block,
          chainReferenceDataUrl: cover.dataUrl,
          qualityGate: qualityCheck,
        }),
      });
      const json = (await res.json()) as {
        dataUrl?: string;
        error?: string;
        quality?: QualityScore | null;
      };
      if (!res.ok || !json.dataUrl)
        throw new Error(json.error || "Belongs-to page failed");
      setBelongsTo({
        status: "done",
        dataUrl: json.dataUrl,
        quality: json.quality ?? null,
        model: interiorModel,
      });
    } catch (e) {
      if (isAbortError(e)) {
        setBelongsTo({ status: "pending" });
        return;
      }
      setBelongsTo({
        status: "error",
        error: e instanceof Error ? e.message : "Belongs-to page failed",
      });
    }
  }, [
    plan,
    items,
    belongsToStyle,
    qualityCheck,
    characterLock.block,
    cover.dataUrl,
    interiorModel,
  ]);

  const generatePage = useCallback(
    async (
      item: PromptItem,
      improvementHint?: string,
      chainReferenceDataUrl?: string,
    ): Promise<string | undefined> => {
      if (!plan) return undefined;
      // Hard gate: interior pages can ONLY be generated after the front
      // cover exists. The cover is the chain anchor + character-lock
      // source, and pages reference it for cross-page consistency. Without
      // this guard, pages generated before the cover would have characters
      // that drift across the book. Show a friendly info dialog instead
      // of marking the card with a red error — the page state stays
      // pending so the user can retry once the cover is done.
      if (cover.status !== "done" || !cover.dataUrl) {
        void dialog.alert({
          title: "Generate the front cover first",
          message:
            "Interior pages reference the front cover for character consistency — characters, palette, and overall style are anchored to the cover. Generate the front cover first, then come back to render this page.",
          variant: "info",
        });
        return undefined;
      }
      updateItem(item.id, { status: "generating", error: undefined });

      const flawSuffix = improvementHint
        ? ` (PREVIOUS ATTEMPT WAS POOR — vision rater said: "${improvementHint}". The new image MUST fix this specific issue.)`
        : "";
      const seed = improvementHint
        ? `${item.id}#${Date.now().toString(36)}`
        : item.id;

      try {
        if (mode === "story") {
          if (!plan.characters?.length || !plan.palette) {
            throw new Error(
              "Story brief is missing characters or palette — open the chat and re-finalize the brief.",
            );
          }
          const res = await fetch("/api/generate-story-page", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abortRef.current?.signal,
            body: JSON.stringify({
              ageBand: age,
              characters: plan.characters,
              palette: plan.palette,
              scene: item.subject + flawSuffix,
              dialogue: item.dialogue,
              narration: item.narration,
              composition: item.composition,
              coverReferenceDataUrl:
                cover.dataUrl && cover.dataUrl !== chainReferenceDataUrl
                  ? cover.dataUrl
                  : undefined,
              chainReferenceDataUrl,
              model: interiorModel,
              coverStyle,
            }),
          });
          const json = (await res.json()) as {
            dataUrl?: string;
            error?: string;
          };
          if (!res.ok || !json.dataUrl) {
            throw new Error(json.error || "Story page failed");
          }
          updateItem(item.id, {
            status: "done",
            dataUrl: json.dataUrl,
            quality: null,
            model: interiorModel,
          });
          return json.dataUrl;
        }
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current?.signal,
          body: JSON.stringify({
            mode: "subject",
            subject: item.subject + flawSuffix,
            age,
            detail: detailLevel,
            background: "scene",
            aspectRatio,
            scene: plan.scene,
            variantSeed: seed,
            referenceDataUrl: reference ?? undefined,
            chainReferenceDataUrl,
            // Pass cover as a SECOND visual reference ONLY for books
            // with recurring characters (story mode, OR Q&A pages whose
            // subject shares a key noun with the cover scene — e.g. a
            // "cute cats" book where every page is some kind of cat).
            // For alphabet / themed Q&A books where each page is a
            // wholly different subject (Apple, Ball, Cat, Drum…),
            // sending the cover as a reference forces the cover's main
            // subject (an apple) onto every other page. Same gate as
            // chainReferenceDataUrl above so the two refs travel
            // together.
            coverReferenceDataUrl:
              cover.dataUrl &&
                cover.dataUrl !== chainReferenceDataUrl &&
                shareKeyNoun(plan.coverScene ?? "", item.subject)
                ? cover.dataUrl
                : undefined,
            characterLock: characterLock.block,
            qualityGate: qualityCheck,
            model: interiorModel,
          }),
        });
        const json = (await res.json()) as {
          dataUrl?: string;
          error?: string;
          quality?: QualityScore | null;
        };
        if (!res.ok || !json.dataUrl) {
          throw new Error(json.error || "Page failed");
        }

        updateItem(item.id, {
          status: "done",
          dataUrl: json.dataUrl,
          quality: json.quality ?? null,
          model: interiorModel,
        });
        return json.dataUrl;
      } catch (e) {
        // User-triggered pause/cancel aborts the in-flight fetch — don't
        // mark this as a "real" failure. Roll the page back to pending so
        // the user can resume / retry without an angry red error card.
        if (isAbortError(e)) {
          updateItem(item.id, { status: "pending", error: undefined });
          return undefined;
        }
        updateItem(item.id, {
          status: "error",
          error: e instanceof Error ? e.message : "Failed",
        });
        return undefined;
      }
    },
    [
      plan,
      mode,
      age,
      aspectRatio,
      reference,
      qualityCheck,
      characterLock.block,
      interiorModel,
      cover.status,
      cover.dataUrl,
      dialog,
      detailLevel,
    ]
  );

  // Manual regenerations (from refine modal / regen card button) — pick any
  // other already-done page as the chain anchor, but only USE it when the
  // gate allows: Story mode always chains; Q&A only chains when the
  // regenerated page shares a key noun with the anchor (so a "20 different
  // lions" Q&A book still gets character consistency across re-rolls).
  const regeneratePage = useCallback(
    async (item: PromptItem, improvementHint?: string) => {
      const anchorItem = items.find(
        (it) => it.id !== item.id && it.status === "done" && it.dataUrl,
      );
      const useChain =
        anchorItem &&
        (mode === "story" || shareKeyNoun(anchorItem.subject, item.subject));
      await generatePage(
        item,
        improvementHint,
        useChain ? anchorItem.dataUrl : undefined,
      );
    },
    [items, generatePage, mode],
  );

  const startGeneration = useCallback(async () => {
    if (runningRef.current || !plan) return;
    if (cover.status !== "done") return;
    runningRef.current = true;
    cancelRef.current = false;
    pausedRef.current = false;
    abortRef.current = new AbortController();
    setPhase("generating");

    try {
      // Character locker — kick off in background if not done; the
      // bulk loop does NOT await it. Pages that start before the lock
      // arrives will use whatever lock state is current; pages after
      // get the freshly-extracted descriptors. Without this the loop
      // could appear stuck for 5-15s on a slow vision call before
      // any page started rendering.
      // Story mode skips this — the brief already locks characters.
      if (mode !== "story" && characterLock.status !== "done") {
        void extractCharacterLock().catch(() => { });
      }

      // Pages sequentially. CHAIN ANCHOR strategy (two-tier):
      //   - INITIAL anchor: the COVER (character spec — the canonical
      //     "this is what the cat looks like" reference). Cover has no
      //     internal border (full-bleed) so it can't anchor border style.
      //   - SWITCH to FIRST DONE INTERIOR PAGE once one exists. The
      //     first interior page contains BOTH the character AND the
      //     printable border, so subsequent pages can match border
      //     position + thickness as well as character look. This is the
      //     fix for "horse has clean border, hen has different border"
      //     drift across pages.
      // Chain gate: when cover/interior anchor exists, ALWAYS chain
      // (Story mode or Q&A noun-overlap is overridden because the
      // anchor IS the canonical reference for this book).
      const seedDone = items.find((it) => it.status === "done" && it.dataUrl);
      let anchor: { dataUrl: string; subject: string } | undefined = seedDone?.dataUrl
        ? { dataUrl: seedDone.dataUrl, subject: seedDone.subject }
        : cover.dataUrl
          ? {
            dataUrl: cover.dataUrl,
            subject: plan.coverScene ?? plan.title ?? "cover",
          }
          : undefined;
      const total = itemsRef.current.length;
      for (let i = 0; i < total; i++) {
        if (cancelRef.current) break;
        while (pausedRef.current && !cancelRef.current) {
          await new Promise((r) => setTimeout(r, 200));
        }
        if (cancelRef.current) break;
        setCurrentIndex(i);
        const item = itemsRef.current[i];
        if (!item) continue;
        if (item.status === "done") {
          // Promote first done interior to anchor (for border consistency).
          if (
            item.dataUrl &&
            (!anchor ||
              (cover.dataUrl && anchor.dataUrl === cover.dataUrl))
          ) {
            anchor = { dataUrl: item.dataUrl, subject: item.subject };
          }
          continue;
        }
        // Story mode = always chain (recurring named characters across
        // every page). Q&A coloring mode = chain ONLY when the new page's
        // subject shares a key noun with the anchor — otherwise alphabet /
        // themed books where each page is a different subject (Apple,
        // Ball, Cat, Drum…) all bleed the anchor's character/scene into
        // every page. The previous always-on coverOrInteriorAnchor flag
        // was the cause of "every alphabet page showed the same apple".
        const useChain =
          !!anchor &&
          (mode === "story" ||
            shareKeyNoun(anchor.subject, item.subject));
        const dataUrl = await generatePage(
          item,
          undefined,
          useChain ? anchor!.dataUrl : undefined,
        );
        if (dataUrl) {
          // Once we have a successful interior page, switch the anchor
          // to it so pages 2..N also lock the border style, not just
          // the character. Don't downgrade an interior anchor.
          const isFirstInteriorAnchor =
            !anchor || (cover.dataUrl && anchor.dataUrl === cover.dataUrl);
          if (isFirstInteriorAnchor) {
            anchor = { dataUrl, subject: item.subject };
          }
        }
      }

      setPhase(cancelRef.current ? "review" : "done");
    } finally {
      runningRef.current = false;
    }
  }, [
    plan,
    cover.status,
    cover.dataUrl,
    characterLock.status,
    items,
    extractCharacterLock,
    generatePage,
    mode,
  ]);

  const pause = () => {
    pausedRef.current = true;
    setPhase("paused");
    // Abort any in-flight /api/generate so the current page stops
    // immediately. Then prep a fresh controller for resume.
    abortRef.current?.abort();
    abortRef.current = new AbortController();
  };
  const resume = () => {
    pausedRef.current = false;
    // Make sure the controller is fresh in case it was aborted by pause.
    if (abortRef.current?.signal.aborted) {
      abortRef.current = new AbortController();
    }
    if (!runningRef.current) void startGeneration();
    else setPhase("generating");
  };
  const cancel = () => {
    cancelRef.current = true;
    pausedRef.current = false;
    runningRef.current = false;
    abortRef.current?.abort();
    setPhase("review");
  };

  const downloadZip = useCallback(async () => {
    const done = items.filter((i) => i.status === "done" && i.dataUrl);
    if (done.length === 0 && cover.status !== "done") return;
    setPdfBuilding(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      if (cover.status === "done" && cover.dataUrl) {
        zip.file("00_cover.png", cover.dataUrl.split(",")[1], { base64: true });
      }
      if (
        belongsTo.status === "done" &&
        belongsTo.dataUrl &&
        mode !== "story"
      ) {
        zip.file("01_belongs_to.png", belongsTo.dataUrl.split(",")[1], {
          base64: true,
        });
      }
      for (const item of done) {
        const safe = item.name.replace(/[^a-z0-9]+/gi, "_");
        zip.file(`${item.id}_${safe}.png`, item.dataUrl!.split(",")[1], {
          base64: true,
        });
      }
      if (backCover.status === "done" && backCover.dataUrl) {
        zip.file("zz_back_cover.png", backCover.dataUrl.split(",")[1], {
          base64: true,
        });
      }
      // PNGs are already DEFLATE-compressed inside the file format, so
      // re-running JSZip's compression on them buys ~0% size and burns
      // 10-60 seconds of CPU on a 26+ page book at 1024×1536 (the size
      // OpenAI gpt-image returns). Use STORE to skip the redundant pass —
      // the zip is just a container here, not a compression archive.
      const blob = await zip.generateAsync({
        type: "blob",
        compression: "STORE",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(plan?.coverTitle ?? "coloring-book").replace(/[^a-z0-9]+/gi, "_")}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setPdfBuilding(false);
    }
  }, [items, cover, backCover, belongsTo, mode, plan]);

  const downloadPdf = useCallback(async () => {
    const done = items.filter((i) => i.status === "done" && i.dataUrl);
    if (
      done.length === 0 ||
      cover.status !== "done" ||
      !cover.dataUrl ||
      backCover.status !== "done" ||
      !backCover.dataUrl
    ) {
      void dialog.alert({
        title: "Print package not ready",
        message:
          "Front cover, back cover, and at least one interior page are required for the KDP download.",
        variant: "info",
      });
      return;
    }
    setPdfBuilding(true);
    try {
      if (mode === "story") {
        const safeName = (plan?.coverTitle ?? "story-book").replace(
          /[^a-z0-9]+/gi,
          "_",
        );
        const storyPages = done.map((d) => ({
          id: d.id,
          name: d.name,
          dataUrl: d.dataUrl,
        }));
        const storyBaseBody = {
          title: plan?.coverTitle ?? plan?.title,
          cover: { dataUrl: cover.dataUrl },
          backCover: { dataUrl: backCover.dataUrl },
          pages: storyPages,
        };
        const [coverRes, interiorRes, etsyA4Res] = await Promise.all([
          fetch("/api/assemble-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: plan?.coverTitle ?? "story-book",
              cover: { dataUrl: cover.dataUrl },
              backCover: { dataUrl: backCover.dataUrl },
              mode: "cover-wrap",
              paper: "standardColor",
              interiorPageCount: storyPages.length,
              trimWidthInches: 6,
              trimHeightInches: 9,
            }),
          }),
          fetch("/api/assemble-story-book-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: plan?.coverTitle ?? plan?.title,
              pages: storyPages,
              trimWidthInches: 6,
              trimHeightInches: 9,
            }),
          }),
          fetch("/api/assemble-story-book-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...storyBaseBody,
              trimWidthInches: 8.27,
              trimHeightInches: 11.69,
            }),
          }),
        ]);

        if (!coverRes.ok) {
          const j = await coverRes.json().catch(() => ({}));
          throw new Error(j.error || "Story cover-wrap PDF failed");
        }
        if (!interiorRes.ok) {
          const j = await interiorRes.json().catch(() => ({}));
          throw new Error(j.error || "Story interior PDF failed");
        }
        if (!etsyA4Res.ok) {
          const j = await etsyA4Res.json().catch(() => ({}));
          throw new Error(j.error || "Story Etsy A4 PDF failed");
        }

        const [coverBlob, interiorBlob, etsyA4Blob] = await Promise.all([
          coverRes.blob(),
          interiorRes.blob(),
          etsyA4Res.blob(),
        ]);

        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        zip.file(
          `${safeName}_cover_KDP.pdf`,
          await coverBlob.arrayBuffer(),
        );
        zip.file(
          `${safeName}_interior_KDP.pdf`,
          await interiorBlob.arrayBuffer(),
        );
        zip.file(`${safeName}_etsy_a4.pdf`, await etsyA4Blob.arrayBuffer());
        zip.file(
          "README.txt",
          [
            "CrayonSparks → Story-book print package",
            "",
            `Title:  ${plan?.coverTitle ?? plan?.title ?? "Story book"}`,
            `Pages:  ${storyPages.length} interior scenes`,
            `Trim:   6 × 9 inches (KDP color paperback standard)`,
            "",
            "This zip contains 3 PDFs — pick the ones that match where",
            "you're publishing.",
            "",
            "── AMAZON KDP (color paperback) ──────────────────────────────",
            `  1. ${safeName}_cover_KDP.pdf`,
            "     Upload to the COVER section of KDP. Sized to KDP's exact",
            `     cover-wrap dimensions (back + spine + front + 0.125" bleed)`,
            "     for color paper at this interior page count.",
            "",
            `  2. ${safeName}_interior_KDP.pdf`,
            "     Upload to the INTERIOR / MANUSCRIPT section. Story scenes",
            "     in narrative order, full-bleed, no blank pages between",
            "     (story books print both sides full-color, unlike coloring",
            "     books which need alternating blanks).",
            "",
            "  Help: https://kdp.amazon.com/en_US/help/topic/G201834260",
            "",
            "── ETSY / GUMROAD (digital download) ─────────────────────────",
            "  Single PDF in this order:",
            "    • Page 1     — Front cover (full color)",
            "    • Pages 2..N — Story scenes back-to-back (no blanks)",
            "    • Last page  — Back cover",
            "",
            `  3. ${safeName}_etsy_a4.pdf — A4 (210×297 mm)`,
            "     A4 is the standard worldwide outside the US and prints",
            "     fine on US Letter printers (slight margin trim).",
          ].join("\n"),
        );

        const zipBytes = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });
        const url = URL.createObjectURL(zipBytes);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeName}_print_package.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setPdfBuilding(false);
        return;
      }
      const baseBody = {
        title: plan?.title,
        category: plan?.coverTitle ?? "book",
        cover: { dataUrl: cover.dataUrl },
        backCover: { dataUrl: backCover.dataUrl },
        belongsTo:
          belongsTo.status === "done" && belongsTo.dataUrl
            ? { dataUrl: belongsTo.dataUrl, style: belongsToStyle }
            : undefined,
        pages: done.map((d) => ({
          id: d.id,
          name: d.name,
          dataUrl: d.dataUrl,
        })),
      };

      // Fetch THREE PDFs in parallel:
      //   1. KDP cover wrap (back + spine + front, KDP-spec dimensions)
      //   2. KDP interior (alternating blanks per KDP convention)
      //   3. Etsy/Gumroad single PDF — A4 (210×297mm), prints fine on US Letter
      const [coverRes, interiorRes, etsyA4Res] = await Promise.all([
        fetch("/api/assemble-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...baseBody,
            mode: "cover-wrap",
            // Interior page count drives spine width math.
            // Actual interior PDF layout per assembleColoringBookPdf:
            //   1 belongs-to page + 1 blank after + N × (page + blank)
            //   = N*2 + 2  (NOT N*2 + 4 — that over-counts by 2)
            // If belongs-to is missing for some reason, subtract 2.
            interiorPageCount:
              done.length * 2 +
              (belongsTo.status === "done" && belongsTo.dataUrl ? 2 : 0),
            paper: "bw",
            trimWidthInches: 8.5,
            trimHeightInches: 11,
          }),
        }),
        fetch("/api/assemble-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...baseBody,
            mode: "interior",
          }),
        }),
        fetch("/api/assemble-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...baseBody,
            mode: "combined",
            includeBlankPages: false,
            // A4: 210 × 297 mm = 8.2677 × 11.6929 inches
            trimWidthInches: 8.27,
            trimHeightInches: 11.69,
          }),
        }),
      ]);

      if (!coverRes.ok) {
        const j = await coverRes.json().catch(() => ({}));
        throw new Error(j.error || "Cover-wrap PDF failed");
      }
      if (!interiorRes.ok) {
        const j = await interiorRes.json().catch(() => ({}));
        throw new Error(j.error || "Interior PDF failed");
      }
      if (!etsyA4Res.ok) {
        const j = await etsyA4Res.json().catch(() => ({}));
        throw new Error(j.error || "Etsy A4 PDF failed");
      }

      const [coverBlob, interiorBlob, etsyA4Blob] = await Promise.all([
        coverRes.blob(),
        interiorRes.blob(),
        etsyA4Res.blob(),
      ]);

      const { default: JSZip } = await import("jszip");
      const safeName = (plan?.coverTitle ?? "book").replace(
        /[^a-z0-9]+/gi,
        "_",
      );
      const zip = new JSZip();
      zip.file(`${safeName}_cover_KDP.pdf`, await coverBlob.arrayBuffer());
      zip.file(`${safeName}_interior_KDP.pdf`, await interiorBlob.arrayBuffer());
      zip.file(`${safeName}_etsy_a4.pdf`, await etsyA4Blob.arrayBuffer());
      zip.file(
        "README.txt",
        [
          "CrayonSparks → Print package",
          "",
          "This zip contains 3 PDFs — pick the ones that match where you're",
          "publishing.",
          "",
          "── AMAZON KDP (paperback) ────────────────────────────────────",
          `  1. ${safeName}_cover_KDP.pdf`,
          "     Upload to the COVER section of KDP. Sized to KDP's exact",
          "     cover-wrap dimensions (back + spine + front + 0.125\" bleed).",
          "",
          `  2. ${safeName}_interior_KDP.pdf`,
          "     Upload to the INTERIOR / MANUSCRIPT section. Contains the",
          "     'This Book Belongs To' page followed by every coloring page",
          "     with KDP's required alternating blank pages.",
          "",
          "  Help: https://kdp.amazon.com/en_US/help/topic/G201834260",
          "",
          "── ETSY / GUMROAD (digital download) ─────────────────────────",
          "  Single PDF in this order:",
          "    • Page 1     — Front cover (full color)",
          "    • Page 2     — 'This Book Belongs To' nameplate",
          "    • Pages 3..N — Coloring pages, back-to-back (no blanks)",
          "    • Last page  — Back cover",
          "",
          `  3. ${safeName}_etsy_a4.pdf — A4 (210×297 mm)`,
          "     A4 is the standard worldwide outside the US and prints",
          "     fine on US Letter printers (slight margin trim).",
        ].join("\n"),
      );

      const zipBytes = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      const url = URL.createObjectURL(zipBytes);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}_print_package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      void dialog.alert({
        title: "PDF assembly failed",
        message: e instanceof Error ? e.message : "PDF assembly failed",
        variant: "danger",
      });
    } finally {
      setPdfBuilding(false);
    }
  }, [items, cover, backCover, belongsTo, belongsToStyle, plan, mode, dialog]);

  // Progress counts INTERIOR pages only — front/back cover and the
  // belongs-to nameplate live in their own tiles and have their own status
  // pills. Mixing them into the page count produced "1/27 pages" while the
  // carousel correctly reports "26 interior pages", which read as a bug.
  const progress = useMemo(() => {
    const total = items.length;
    const doneCount = items.filter((i) => i.status === "done").length;
    return { doneCount, total };
  }, [items]);

  // "Everything is ready" gate — used to enable book preview / download /
  // the all-done summary card. Requires every interior page done AND both
  // covers ready, since those are mandatory to assemble the KDP package.
  const allDone =
    progress.total > 0 &&
    progress.doneCount === progress.total &&
    cover.status === "done" &&
    backCover.status === "done";

  if (phase === "idea" || phase === "planning") {
    return (
      <IdeaForm
        idea={idea}
        setIdea={setIdea}
        pageCount={pageCount}
        setPageCount={setPageCount}
        age={age}
        setAge={setAge}
        detailLevel={detailLevel}
        setDetailLevel={setDetailLevel}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        reference={reference}
        setReference={setReference}
        planning={planning}
        onPlan={runPlan}
        error={planError}
        bookKind={bookKind}
        setBookKind={setBookKind}
        storyType={storyType}
        setStoryType={setStoryType}
        storyCharacterNames={storyCharacterNames}
        setStoryCharacterNames={setStoryCharacterNames}
        dialogueStyle={dialogueStyle}
        setDialogueStyle={setDialogueStyle}
        onSwitchToChat={onSwitchToChat}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan summary + controls */}
      {plan && (
        <div className="rounded-3xl p-6 md:p-8 bg-linear-to-br from-violet-500 via-indigo-400 to-cyan-400 text-white shadow-xl shadow-violet-500/30 relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white mb-2">
                  <BookPlus className="w-3 h-3" /> AI-planned · {AGE_LABELS[age]}
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">
                  {plan.coverTitle}
                </h2>
                <p className="mt-2 text-white/90 text-sm md:text-base max-w-2xl">
                  {plan.description}
                </p>
                {plan.notes && (
                  <p className="mt-2 text-[11px] text-white/70 italic">
                    <Lightbulb className="inline w-3 h-3 mr-1 mb-0.5" />
                    {plan.notes}
                  </p>
                )}
                <p className="mt-3 text-white/80 text-xs font-mono">
                  {progress.doneCount}/{progress.total} generated · cover{" "}
                  {cover.status === "done" ? "✓" : "pending"}
                  {mode !== "story" && (
                    <>
                      {" "}
                      · character-lock{" "}
                      {characterLock.status === "done"
                        ? "✓"
                        : characterLock.status === "extracting"
                          ? "…"
                          : characterLock.status === "error"
                            ? "⚠"
                            : "pending"}
                    </>
                  )}
                </p>
                {mode !== "story" && characterLock.status === "error" && (
                  <button
                    type="button"
                    onClick={() => void extractCharacterLock()}
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/10 text-white hover:bg-white/20 border border-white/30"
                    title={characterLock.error}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry character lock
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={reset}
                  disabled={pdfBuilding}
                  title={
                    pdfBuilding
                      ? "Wait for the download to finish"
                      : "Start over with a new idea"
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-sm font-medium bg-white/5 text-white hover:bg-white/15 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Start new book
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
              <motion.div
                className="h-full bg-white"
                animate={{ width: `${(progress.doneCount / Math.max(1, progress.total)) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      )}

      {plan && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
            Image models
          </span>
          <ModelPicker
            label="Cover"
            value={coverModel}
            options={COVER_MODEL_OPTIONS}
            onChange={setCoverModel}
            title="Image model used for the front and back cover. Pro is the default — Amazon thumbnails reward fidelity."
          />
          <ModelPicker
            label="Pages"
            value={interiorModel}
            options={INTERIOR_MODEL_OPTIONS}
            onChange={setInteriorModel}
            title="Image model used for interior pages and the 'this book belongs to' page. 3.1 Flash is the workhorse default — keeps cost predictable on bulk runs."
          />
          <div className="ml-auto">
            <PlanReviewButton
              data={{
                title: plan.title,
                coverTitle: plan.coverTitle,
                description: plan.description,
                scene: plan.scene,
                coverScene: plan.coverScene,
                characters:
                  mode === "story" ? plan.characters : undefined,
                prompts: plan.prompts.map((p) => ({
                  name: p.name,
                  subject: p.subject,
                  dialogue: p.dialogue,
                  narration: p.narration,
                })),
              }}
              modeNotice={
                mode === "story"
                  ? "Story-book pages render with locked characters + palette + the dialogue / narration shown per page below."
                  : undefined
              }
              onSave={(next) => {
                // Plan-level fields (title / cover / scene / description)
                // flow back into plan state. Per-page name + subject are
                // mirrored into items[] (the live working set the carousel
                // and generation loop read from). Already-rendered pages
                // keep their image — only future regenerations pick up
                // the new prompts.
                setPlan((prev) =>
                  prev
                    ? {
                      ...prev,
                      title: next.title ?? prev.title,
                      coverTitle: next.coverTitle ?? prev.coverTitle,
                      description: next.description ?? prev.description,
                      scene: next.scene ?? prev.scene,
                      coverScene: next.coverScene ?? prev.coverScene,
                      prompts: next.prompts.map((p, i) => ({
                        ...prev.prompts[i],
                        name: p.name,
                        subject: p.subject,
                      })),
                    }
                    : prev,
                );
                setItems((prev) =>
                  prev.map((it, i) => {
                    const np = next.prompts[i];
                    if (!np) return it;
                    return { ...it, name: np.name, subject: np.subject };
                  }),
                );
              }}
            />
          </div>
        </div>
      )}

      {/* Cover pair (shared with /generate) — front + back side-by-side */}
      {plan && (
        <CoverPair
          bookSlug={(plan.coverTitle ?? plan.title ?? "book")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}
          title={plan.coverTitle ?? plan.title ?? "Coloring book"}
          description={plan.description ?? plan.coverScene}
          // Story books print at 6×9 (2:3); coloring books at 8.5×11
          // (~3:4). The tile aspect mirrors the actual print trim so the
          // full cover is visible — title at the top, tagline at the
          // bottom, no cropping.
          coverAspect={mode === "story" ? "2 / 3" : "3 / 4"}
          refineStatus={refineStatus}
          rightExtras={
            <MockupGate
              frontCoverReady={!!cover.dataUrl}
              pagesReady={progress.doneCount}
              minPages={3}
            >
              <MockupGenerator
                coverDataUrl={cover.dataUrl ?? null}
                interiorDataUrl={
                  items.find((it) => it.status === "done" && it.dataUrl)?.dataUrl
                }
                title={`${plan.coverTitle ?? "Book"} — Amazon mockups`}
                bookName={plan.coverTitle ?? "book"}
              />
            </MockupGate>
          }
          frontCover={cover}
          backCover={backCover}
          coverStyle={coverStyle}
          coverBorder={coverBorder}
          onCoverStyleChange={setCoverStyle}
          onCoverBorderChange={setCoverBorder}
          onRegenerateFront={() => void generateCover()}
          onRegenerateBack={() => void generateBackCover()}
          frontLocked={
            phase === "generating" ||
            phase === "paused" ||
            items.some((it) => it.status === "done")
          }
          frontLockedReason={
            phase === "generating" || phase === "paused"
              ? "Front cover is locked while interior pages are generating. Pages reference it for character consistency."
              : "Front cover is locked — interior pages already reference it. Click Start new book to begin a new project."
          }
          onRefineFront={(dataUrl) => {
            const coverLocked =
              phase === "generating" ||
              phase === "paused" ||
              items.some((it) => it.status === "done");
            openRefine({
              context: mode === "story" ? "story-cover" : "cover",
              targetId: "cover",
              dataUrl,
              title: "Cover",
              subtitle: coverLocked
                ? "Tweaks only — interior pages already reference this cover. Ask for small adjustments (text, colors, accessories); avoid full redesigns or character changes."
                : mode === "story"
                  ? "Describe changes. Sparky edits the painterly cover while preserving title, characters, and overlays."
                  : "Describe changes. Gemini edits while preserving layout.",
              downloadName: "cover.png",
              model: cover.model ?? coverModel,
              onRefined: (d) =>
                setCover({
                  status: "done",
                  dataUrl: d,
                  model: cover.model ?? coverModel,
                }),
            });
          }}
          onRefineBack={(dataUrl) => {
            openRefine({
              context: mode === "story" ? "story-back-cover" : "back-cover",
              targetId: "back-cover",
              dataUrl,
              title: "Back cover",
              subtitle:
                mode === "story"
                  ? "Describe changes. The minimal tagline-only back cover stays minimal — no illustrations added."
                  : "Describe changes. Gemini edits while preserving the tagline box and barcode safe-zone.",
              downloadName: "back-cover.png",
              model: backCover.model ?? coverModel,
              onRefined: (d) =>
                setBackCover({
                  status: "done",
                  dataUrl: d,
                  model: backCover.model ?? coverModel,
                }),
            });
          }}
          // View-only handlers — open the existing preview lightbox so
          // the cover/back-cover stay clickable for "view at full size"
          // even when refine is locked (e.g. front cover after interior
          // pages have started, back cover before front exists).
          onViewFront={(dataUrl) => openStoryPreview(dataUrl, "Front cover")}
          onViewBack={(dataUrl) => openStoryPreview(dataUrl, "Back cover")}
          belongsTo={mode === "story" ? undefined : belongsTo}
          belongsToStyle={mode === "story" ? undefined : belongsToStyle}
          onBelongsToStyleChange={mode === "story" ? undefined : setBelongsToStyle}
          onRegenerateBelongsTo={
            mode === "story" ? undefined : () => void generateBelongsToPage()
          }
          onRefineBelongsTo={
            mode === "story"
              ? undefined
              : (dataUrl) =>
                openRefine({
                  context: "page",
                  targetId: "belongs-to",
                  dataUrl,
                  title: "This Book Belongs To",
                  subtitle:
                    "Page 2 — auto-generated nameplate. Refine to tweak the banner, characters, or name line.",
                  downloadName: "belongs_to.png",
                  model: belongsTo.model ?? interiorModel,
                  onRefined: (d) =>
                    setBelongsTo({
                      status: "done",
                      dataUrl: d,
                      model: belongsTo.model ?? interiorModel,
                    }),
                  quality: belongsTo.quality,
                })
          }
        />
      )}

      {plan && cover.status === "done" && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="text-xs text-neutral-400 font-mono">
            {progress.doneCount}/{progress.total} pages
            {phase === "generating" && " · generating one by one…"}
            {phase === "paused" && " · paused"}
            {phase === "review" && progress.doneCount === 0 && " · ready"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(phase === "review" || phase === "done") && !allDone && (
              <button
                onClick={startGeneration}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95 shadow-md"
              >
                <Play className="w-4 h-4" /> Start generating
              </button>
            )}
            {phase === "generating" && !pdfBuilding && (
              <>
                <button
                  onClick={pause}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 backdrop-blur border border-white/20"
                >
                  <Pause className="w-4 h-4" /> Pause
                </button>
                <button
                  onClick={cancel}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-red-500/15 text-red-200 hover:bg-red-500/25 border border-red-500/30"
                >
                  <Square className="w-3.5 h-3.5" /> Cancel
                </button>
              </>
            )}
            {phase === "paused" && !pdfBuilding && (
              <>
                <button
                  onClick={resume}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95 shadow-md"
                >
                  <Play className="w-4 h-4" /> Resume
                </button>
                <button
                  onClick={cancel}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-red-500/15 text-red-200 hover:bg-red-500/25 border border-red-500/30"
                >
                  <Square className="w-3.5 h-3.5" /> Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Carousel OR inline page-flip book preview — view toggle inline.
          Toggle unlocks only when the entire book is done (cover + all
          interior pages + back cover) so the page-flip view shows a
          complete, cohesive book rather than a half-empty placeholder. */}
      {plan && allDone && (
        <div className="grid grid-cols-3 items-center gap-2">
          <div aria-hidden />
          <div className="flex justify-center">
            <div
              role="tablist"
              aria-label="Page view"
              className="inline-flex p-1 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur"
            >
              <button
                role="tab"
                aria-selected={viewMode === "carousel"}
                onClick={() => setViewMode("carousel")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${viewMode === "carousel"
                  ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow"
                  : "text-neutral-300 hover:text-white"
                  }`}
              >
                <GalleryHorizontal className="w-4 h-4" />
                Carousel
              </button>
              <button
                role="tab"
                aria-selected={viewMode === "book"}
                onClick={() => setViewMode("book")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${viewMode === "book"
                  ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow"
                  : "text-neutral-300 hover:text-white"
                  }`}
              >
                <BookOpen className="w-4 h-4" />
                Book preview
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <DownloadMenu
              onPdf={downloadPdf}
              onZip={downloadZip}
              pdfBuilding={pdfBuilding}
            />
          </div>
        </div>
      )}
      {plan && (
        <div
          className="rounded-3xl p-4 md:p-6 bg-zinc-900/60 backdrop-blur-xl border border-white/10 relative"
          // Pin a minimum height that fits both the book (≈600px) and the
          // carousel (≈540px). Prevents footer-rises-then-drops flicker
          // when toggling viewMode.
          style={{ minHeight: 620 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {viewMode === "book" && allDone ? (
              <motion.div
                key="book-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col items-center gap-4 py-4 md:py-6"
              >
                <div className="text-center">
                  <h3 className="font-display text-lg font-bold text-white">
                    {plan.coverTitle ?? plan.title ?? "Coloring book"}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Click a page corner or swipe to flip — opens to a 2-page
                    spread like a real book
                  </p>
                </div>
                <BookFlip
                  cover={{ imageUrl: cover.dataUrl }}
                  backCover={{ imageUrl: backCover.dataUrl }}
                  belongsTo={
                    mode === "story"
                      ? undefined
                      : belongsTo.status === "done" && belongsTo.dataUrl
                        ? { imageUrl: belongsTo.dataUrl }
                        : undefined
                  }
                  pages={items.map((it, i) => ({
                    imageUrl: it.dataUrl,
                    label: `${it.name} · Page ${i + 1}`,
                  }))}
                  // Coloring books print one-sided (alternating blank versos
                  // so crayon doesn't bleed onto the next page); picture
                  // books print both sides full-bleed. The story PDF
                  // assembler already does the right thing — these props
                  // mirror that in the preview UI: no blanks AND full-bleed
                  // tiles (no white letterboxing, no page-number overlay).
                  alternateBlankPages={mode !== "story"}
                  fullBleedInterior={mode === "story"}
                  // Page-tile aspect ratio MUST match the actual book trim
                  // size or the cover/pages get cropped. Story books are
                  // 6×9 portrait (2:3 ratio); coloring books are 8.5×11
                  // (~3:4 ratio).
                  width={mode === "story" ? 320 : 360}
                  height={480}
                />
              </motion.div>
            ) : viewMode === "carousel" ? (
              <motion.div
                key="carousel-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Carousel
                  cover={cover}
                  backCover={backCover}
                  items={items}
                  aspectRatio={aspectRatio}
                  coverStyle={coverStyle}
                  coverBorder={coverBorder}
                  onCoverStyleChange={setCoverStyle}
                  onCoverBorderChange={setCoverBorder}
                  onEditPrompt={(id, patch) => updatePromptText(id, patch)}
                  onRemove={removeItem}
                  onRegenerateItem={regeneratePage}
                  onRegenerateCover={generateCover}
                  onRegenerateBackCover={generateBackCover}
                  onOpenRefine={(kind, payload) => {
                    // Resolve which model produced the source so the modal
                    // can inherit it. Looks at the right state slice based
                    // on the surface kind; falls back to the live dropdown
                    // for legacy items that pre-date model tagging.
                    const sourceModel: ImageModel | undefined =
                      kind === "cover"
                        ? cover.model ?? coverModel
                        : kind === "back-cover"
                          ? backCover.model ?? coverModel
                          : (items.find((it) => it.id === payload.targetId)
                            ?.model ?? interiorModel);
                    // Story mode uses story-* refine contexts so the route
                    // injects full-color / character-preserving guardrails
                    // (vs the coloring-book B&W rules).
                    const refineCtx =
                      mode === "story"
                        ? kind === "cover"
                          ? "story-cover"
                          : kind === "back-cover"
                            ? "story-back-cover"
                            : "story-page"
                        : kind;
                    openRefine({
                      context: refineCtx,
                      ...payload,
                      model: sourceModel,
                    });
                  }}
                  onSetCover={(dataUrl) =>
                    // Preserve the existing model — refine output stays on
                    // the lineage of the source that produced it.
                    setCover((c) => ({
                      status: "done",
                      dataUrl,
                      model: c.model ?? coverModel,
                    }))
                  }
                  onSetBackCover={(dataUrl) =>
                    setBackCover((c) => ({
                      status: "done",
                      dataUrl,
                      model: c.model ?? coverModel,
                    }))
                  }
                  onSetItem={(id, dataUrl) =>
                    setItems((prev) =>
                      prev.map((it) =>
                        it.id === id
                          ? { ...it, status: "done", dataUrl }
                          : it,
                      ),
                    )
                  }
                  bookTitle={plan?.coverTitle ?? plan?.title}
                  coverScene={plan?.coverScene}
                  characterLockBlock={characterLock.block}
                  refineStatus={refineStatus}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}

      <ImageRefineModal
        open={refine.open}
        onClose={() => setRefine((r) => ({ ...r, open: false }))}
        context={refine.context}
        sourceDataUrl={refine.dataUrl}
        title={refine.title}
        subtitle={refine.subtitle}
        downloadName={refine.downloadName}
        aspectRatio={aspectRatio}
        onRefined={refine.onRefined}
        quality={refine.quality}
        model={refine.model}
        openNonce={refineOpenNonce}
        onBackgroundChange={(state, explicitTargetId) => {
          const id = explicitTargetId ?? refine.targetId;
          if (!id) return;
          setRefineStatus((prev) => {
            if (state === "idle") {
              const { [id]: _omit, ...rest } = prev;
              return rest;
            }
            return { ...prev, [id]: state };
          });
          if (state === "done") {
            const snapshot = { ...refine, open: true };
            const targetLabel = refine.title?.trim() || "Page";
            toast.success(`Refine done · ${targetLabel}`, {
              description:
                "Background refine landed and was applied to the card.",
              action: {
                label: "Open",
                onClick: () => {
                  setRefineOpenNonce((n) => n + 1);
                  setRefine(snapshot);
                },
              },
              duration: 8000,
            });
            setTimeout(() => {
              setRefineStatus((prev) => {
                if (prev[id] !== "done") return prev;
                const { [id]: _omit, ...rest } = prev;
                return rest;
              });
            }, 4000);
          }
        }}
        // Back-cover refine panel pulls its color palette from the front
        // cover and uses the book title/scene to seed tagline candidates.
        // These props are no-ops on other surfaces.
        frontCoverDataUrl={cover.dataUrl}
        bookTitle={plan?.coverTitle ?? plan?.title}
        coverScene={plan?.coverScene}
        bookDescription={plan?.description}
        pageSubjects={items.map((it) => it.subject).filter(Boolean).slice(0, 12)}
        pageCount={items.length}
        bookContext={
          plan
            ? buildRefineBookContext({
              plan,
              items,
              cover,
              backCover,
              age,
              target: {
                context: refine.context,
                id: refine.targetId,
                title: refine.title,
              },
            })
            : undefined
        }
        getPageDataUrl={(pageId) => {
          if (pageId === "cover") return cover.dataUrl ?? null;
          if (pageId === "back-cover") return backCover.dataUrl ?? null;
          return items.find((it) => it.id === pageId)?.dataUrl ?? null;
        }}
      />

      {/* Story-mode lightbox — opened when the user clicks "refine" on any
          story image. Story refine-as-edit is a follow-up; for now we let
          users see the image at full resolution. */}
      <ImagePreviewDialog
        open={storyPreview.open}
        onClose={() => setStoryPreview((p) => ({ ...p, open: false }))}
        src={storyPreview.src}
        alt={storyPreview.label}
        caption={`${storyPreview.label} — full preview. Story-book refine is coming soon. To change this image, use the regenerate button on the card.`}
      />

      {/* Preview-as-book is now inline above (replaces carousel via viewMode toggle). */}

      {/* KDP metadata generator. The route branches on `kind` — "coloring"
          targets coloring-book SEO; "story" targets picture-book SEO
          (different keywords, categories, copy structure, and price bands). */}
      {plan && allDone && (
        <KdpMetadataPanel
          bookName={plan.coverTitle ?? plan.title ?? "book"}
          pageCount={items.length}
          draft={listingDraft}
          status={listingStatus}
          errors={listingErrors}
          onGenerate={(platform) => void generateMetadata(platform)}
        />
      )}
      {plan && !allDone && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-xs text-violet-200">
          🔒 KDP Metadata generator unlocks once all {items.length} pages are
          generated. Currently {progress.doneCount}/{progress.total} done.
        </div>
      )}
    </div>
  );
}
