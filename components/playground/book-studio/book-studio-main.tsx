"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  LayoutGrid,
} from "lucide-react";
import { prefetchBookFlip, BookFlip } from "@/components/playground/book-flip";
import { ImageRefineModal } from "@/components/generate/image-refine-modal/image-refine-modal-main";
import { MockupGenerator } from "@/components/ui/mockup-generator";
import { MockupGate } from "@/components/ui/mockup-gate";
import { useDialog } from "@/components/ui/confirm-dialog";
import { ImagePreviewDialog } from "@/components/ui/image-preview-dialog";
import { useNavigationGuard } from "@/lib/use-navigation-guard";
import { applyBubbleStyle, type BubbleStyleSnapshot } from "@/lib/bubble-style";
import { DownloadMenu } from "@/components/playground/download-menu";
import { fireConfettiBurst } from "@/components/ui/confetti-burst";
import { SaveBookButton } from "./save-book-button";
import { KdpMetadataPanel } from "@/components/playground/kdp-metadata/kdp-metadata-main";
import { CoverPair } from "@/components/playground/cover-pair";
import { BackCoverEditorModal } from "./back-cover-grid/editor/back-cover-editor-modal";
import { composeBackCover } from "./back-cover-grid/compose-grid";
import {
  makeDefaultDesign,
  toSelectableImages,
  type BackCoverDesign,
} from "./back-cover-grid/back-cover-grid-types";
import { ModelPicker } from "@/components/playground/model-picker";
import {
  PlanReviewButton,
  PlanReviewModal,
  type PlanReviewData,
} from "@/components/playground/plan-review-panel/plan-review-panel-main";
import {
  COVER_MODEL_OPTIONS,
  INTERIOR_MODEL_OPTIONS,
  type ImageModel,
} from "@/lib/constants";
import type { AgeRange, Phase, Plan, PromptItem } from "./types";
import { AGE_LABELS } from "./book-studio-constants";
import { buildRefineBookContext } from "./book-studio-helpers";
import { IdeaForm } from "./idea-form";
import { Carousel } from "./carousel";
import { useStudioPersistence } from "./hooks/use-studio-persistence";
import { toast } from "sonner";
import { FeedbackSurveyModal } from "@/components/feedback/feedback-survey-modal";
import { useFeedback } from "@/lib/hooks/use-feedback";
import { useAuthContext } from "@/components/auth/auth-provider";
import { useBookPlan } from "./hooks/use-book-plan";
import { useCharacterLock } from "./hooks/use-character-lock";
import { useCoverGeneration } from "./hooks/use-cover-generation";
import { usePageGeneration } from "./hooks/use-page-generation";
import { useRefineState } from "./hooks/use-refine-state";
import { useBookDownload } from "./hooks/use-book-download";
import { useListingState } from "./hooks/use-listing-state";

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
  onPlanningChange,
}: {
  initialPlan?: Plan;
  initialAge?: AgeRange;
  initialReference?: string;
  initialMode?: "qa" | "story";
  onSwitchToChat?: (idea: string, mode: "qa" | "story") => void;
  onReset?: () => void;
  onPlanningChange?: (planning: boolean) => void;
} = {}) {
  const dialog = useDialog();
  const [phase, setPhase] = useState<Phase>(initialPlan ? "review" : "idea");
  const [planConfirmed, setPlanConfirmed] = useState<boolean>(!!initialPlan);
  const [planReviewOpen, setPlanReviewOpen] = useState(false);
  const planReviewAutoOpenedRef = useRef<boolean>(!!initialPlan);

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

  const abortRef = useRef<AbortController | null>(null);
  const characterLockBlockRef = useRef<string | undefined>(undefined);
  const itemsRef = useRef<PromptItem[]>([]);
  const bookBubbleStyleRef = useRef<BubbleStyleSnapshot | null>(null);
  const setItemsHandoff = useRef<((items: PromptItem[]) => void) | null>(null);
  const setIndexHandoff = useRef<((n: number) => void) | null>(null);
  const setCoverPendingHandoff = useRef<(() => void) | null>(null);

  const [qualityCheck] = useState(false);
  const [viewMode, setViewMode] = useState<"carousel" | "book">("carousel");
  const [gridEditorOpen, setGridEditorOpen] = useState(false);
  const [backCoverDesign, setBackCoverDesign] = useState<BackCoverDesign | null>(
    null,
  );
  const autoSeededBackCoverRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const enforceMobile = () => {
      if (mq.matches) setViewMode("carousel");
    };
    enforceMobile();
    mq.addEventListener("change", enforceMobile);
    return () => mq.removeEventListener("change", enforceMobile);
  }, []);
  const [storyPreview, setStoryPreview] = useState<{
    open: boolean;
    src: string;
    label: string;
  }>({ open: false, src: "", label: "" });

  const openStoryPreview = useCallback((src: string, label: string) => {
    if (!src) return;
    setStoryPreview({ open: true, src, label });
  }, []);

  useEffect(() => {
    prefetchBookFlip();
  }, []);

  useEffect(() => {
    if (
      phase === "review" &&
      !planConfirmed &&
      !planReviewAutoOpenedRef.current
    ) {
      planReviewAutoOpenedRef.current = true;
      setPlanReviewOpen(true);
    }
    if (phase === "idea") {
      planReviewAutoOpenedRef.current = false;
    }
  }, [phase, planConfirmed]);

  const bookPlan = useBookPlan({
    initialPlan,
    initialAge,
    initialReference,
    initialMode,
    setPhase,
    setItems: (items) => setItemsHandoff.current?.(items),
    setCoverPending: () => setCoverPendingHandoff.current?.(),
    setCurrentIndex: (n) => setIndexHandoff.current?.(n),
  });

  const coverGen = useCoverGeneration({
    plan: bookPlan.plan,
    initialPlan,
    mode: bookPlan.mode,
    age: bookPlan.age,
    itemsRef,
    qualityCheck,
    characterLockBlockRef,
    abortRef,
  });

  const characterLockHook = useCharacterLock({
    plan: bookPlan.plan,
    mode: bookPlan.mode,
    coverStatus: coverGen.cover.status,
    coverDataUrl: coverGen.cover.dataUrl,
  });

  characterLockBlockRef.current = characterLockHook.characterLock.block;

  const pageGen = usePageGeneration({
    plan: bookPlan.plan,
    initialPlan,
    mode: bookPlan.mode,
    age: bookPlan.age,
    aspectRatio: bookPlan.aspectRatio,
    detailLevel: bookPlan.detailLevel,
    reference: bookPlan.reference,
    qualityCheck,
    interiorModel: coverGen.interiorModel,
    coverStyle: coverGen.coverStyle,
    cover: coverGen.cover,
    characterLockStatus: characterLockHook.characterLock.status,
    characterLockBlock: characterLockHook.characterLock.block,
    extractCharacterLock: characterLockHook.extractCharacterLock,
    setPhase,
    abortRef,
    itemsRef,
    bookBubbleStyleRef,
  });

  setItemsHandoff.current = pageGen.setItems;
  setIndexHandoff.current = pageGen.setCurrentIndex;
  setCoverPendingHandoff.current = () =>
    coverGen.setCover({ status: "pending" });

  const studioPersistence = useStudioPersistence({
    storageKey: "current-book-draft",
    enabled: !initialPlan,
    values: {
      version: 1,
      bookKind: bookPlan.bookKind,
      idea: bookPlan.idea,
      pageCount: bookPlan.pageCount,
      age: bookPlan.age,
      aspectRatio: bookPlan.aspectRatio,
      detailLevel: bookPlan.detailLevel,
      coverStyle: coverGen.coverStyle,
      coverBorder: coverGen.coverBorder,
      plan: bookPlan.plan,
      items: pageGen.items,
      cover: coverGen.cover,
      backCover: coverGen.backCover,
      belongsTo: coverGen.belongsTo,
      theEndPage: coverGen.theEndPage,
      phase,
    },
    setters: {
      setBookKind: bookPlan.setBookKind,
      setIdea: bookPlan.setIdea,
      setPageCount: bookPlan.setPageCount,
      setAge: bookPlan.setAge,
      setAspectRatio: bookPlan.setAspectRatio,
      setDetailLevel: bookPlan.setDetailLevel,
      setCoverStyle: coverGen.setCoverStyle,
      setCoverBorder: coverGen.setCoverBorder,
      setPlan: bookPlan.setPlan,
      setItems: pageGen.setItems,
      setCover: coverGen.setCover,
      setBackCover: coverGen.setBackCover,
      setBelongsTo: coverGen.setBelongsTo,
      setTheEndPage: coverGen.setTheEndPage,
      setPhase,
    },
  });

  const refineState = useRefineState();

  const download = useBookDownload({
    plan: bookPlan.plan,
    items: pageGen.items,
    cover: coverGen.cover,
    backCover: coverGen.backCover,
    belongsTo: coverGen.belongsTo,
    belongsToStyle: coverGen.belongsToStyle,
    theEndPage: coverGen.theEndPage,
    mode: bookPlan.mode,
  });
  const downloadPdf = useCallback(async () => {
    await download.downloadPdf();
    fireConfettiBurst(window.innerWidth / 2, window.innerHeight / 2);
  }, [download]);
  const downloadZip = useCallback(async () => {
    await download.downloadZip();
    fireConfettiBurst(window.innerWidth / 2, window.innerHeight / 2);
  }, [download]);

  const listing = useListingState({
    plan: bookPlan.plan,
    mode: bookPlan.mode,
    age: bookPlan.age,
    items: pageGen.items,
  });

  const reset = () => {
    pageGen.cancelRef.current = true;
    pageGen.runningRef.current = false;
    pageGen.pausedRef.current = false;
    setPhase("idea");
    bookPlan.setPlan(null);
    pageGen.setItems([]);
    coverGen.setCover({ status: "pending" });
    coverGen.setBackCover({ status: "pending" });
    coverGen.setTheEndPage({ status: "pending" });
    pageGen.setCurrentIndex(0);
    setPlanConfirmed(false);
    setPlanReviewOpen(false);
    planReviewAutoOpenedRef.current = false;
    studioPersistence.clearDraft();
    onReset?.();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const progress = useMemo(() => {
    const total = pageGen.items.length;
    const doneCount = pageGen.items.filter((i) => i.status === "done").length;
    return { doneCount, total };
  }, [pageGen.items]);

  const allDone =
    progress.total > 0 &&
    progress.doneCount === progress.total &&
    coverGen.cover.status === "done" &&
    coverGen.backCover.status === "done";

  const { user } = useAuthContext();
  const feedback = useFeedback();
  const [surveyOpen, setSurveyOpen] = useState(false);
  const surveyCheckedRef = useRef(false);
  useEffect(() => {
    if (!allDone) return;
    if (!user) return;
    if (surveyCheckedRef.current) return;
    surveyCheckedRef.current = true;
    void (async () => {
      try {
        const state = await feedback.getSurveyState(bookPlan.bookKind);
        if (state.shouldShow) {
          await feedback.markSurveyShown(bookPlan.bookKind);
          const id = window.setTimeout(() => setSurveyOpen(true), 1500);
          return () => window.clearTimeout(id);
        }
      } catch {
        // non-fatal — never break the studio over a survey check
      }
    })();
  }, [allDone, user, feedback, bookPlan.bookKind]);

  useEffect(() => {
    if (autoSeededBackCoverRef.current) return;
    if (coverGen.cover.status !== "done") return;
    if (coverGen.backCover.status === "done") {
      autoSeededBackCoverRef.current = true;
      return;
    }
    const done = pageGen.items.filter((it) => it.status === "done" && it.dataUrl);
    if (done.length < 4) return;
    autoSeededBackCoverRef.current = true;
    const design = makeDefaultDesign(
      bookPlan.plan?.backCoverTagline ?? bookPlan.plan?.description ?? "",
    );
    design.imageIds = done.slice(0, 4).map((it) => it.id);
    void composeBackCover({
      design,
      imageDataUrls: done.slice(0, 4).map((it) => it.dataUrl as string),
      aspect: bookPlan.mode === "story" ? "2 / 3" : "3 / 4",
    })
      .then((dataUrl) => {
        setBackCoverDesign(design);
        coverGen.setBackCover({ status: "done", dataUrl });
      })
      .catch(() => {
        autoSeededBackCoverRef.current = false;
      });
  }, [coverGen, pageGen.items, bookPlan.plan, bookPlan.mode]);

  useEffect(() => {
    onPlanningChange?.(bookPlan.planning);
  }, [bookPlan.planning, onPlanningChange]);

  const inUnconfirmedReview =
    phase === "review" && !planConfirmed && !!bookPlan.plan;
  if (phase === "idea" || phase === "planning" || inUnconfirmedReview) {
    return (
      <>
        <IdeaForm
          idea={bookPlan.idea}
          setIdea={bookPlan.setIdea}
          pageCount={bookPlan.pageCount}
          setPageCount={bookPlan.setPageCount}
          age={bookPlan.age}
          setAge={bookPlan.setAge}
          detailLevel={bookPlan.detailLevel}
          setDetailLevel={bookPlan.setDetailLevel}
          aspectRatio={bookPlan.aspectRatio}
          setAspectRatio={bookPlan.setAspectRatio}
          reference={bookPlan.reference}
          setReference={bookPlan.setReference}
          planning={bookPlan.planning}
          onPlan={bookPlan.runPlan}
          error={bookPlan.planError}
          bookKind={bookPlan.bookKind}
          setBookKind={bookPlan.setBookKind}
          storyType={bookPlan.storyType}
          setStoryType={bookPlan.setStoryType}
          storyCharacterNames={bookPlan.storyCharacterNames}
          setStoryCharacterNames={bookPlan.setStoryCharacterNames}
          dialogueStyle={bookPlan.dialogueStyle}
          setDialogueStyle={bookPlan.setDialogueStyle}
          onSwitchToChat={onSwitchToChat}
          planReady={inUnconfirmedReview}
          planTitle={
            bookPlan.plan?.coverTitle ?? bookPlan.plan?.title ?? undefined
          }
          planPageCount={bookPlan.plan?.prompts.length}
          onViewPlan={() => setPlanReviewOpen(true)}
        />
        {inUnconfirmedReview && bookPlan.plan && (
          <PlanReviewModal
            open={planReviewOpen}
            onClose={() => setPlanReviewOpen(false)}
            data={{
              title: bookPlan.plan.title,
              coverTitle: bookPlan.plan.coverTitle,
              description: bookPlan.plan.description,
              scene: bookPlan.plan.scene,
              coverScene: bookPlan.plan.coverScene,
              theEndMessage:
                bookPlan.mode === "story"
                  ? bookPlan.plan.theEndMessage
                  : undefined,
              characters:
                bookPlan.mode === "story"
                  ? bookPlan.plan.characters
                  : undefined,
              prompts: bookPlan.plan.prompts.map((p) => ({
                name: p.name,
                subject: p.subject,
                dialogue: p.dialogue,
                narration: p.narration,
              })),
            }}
            modeNotice={
              bookPlan.mode === "story"
                ? "Story-book pages render with locked characters + palette + the dialogue / narration shown per page below."
                : undefined
            }
            onSave={(next) => {
              bookPlan.setPlan((prev) =>
                prev
                  ? {
                    ...prev,
                    title: next.title ?? prev.title,
                    coverTitle: next.coverTitle ?? prev.coverTitle,
                    description: next.description ?? prev.description,
                    scene: next.scene ?? prev.scene,
                    coverScene: next.coverScene ?? prev.coverScene,
                    theEndMessage:
                      next.theEndMessage ?? prev.theEndMessage,
                    prompts: next.prompts.map((p, i) => ({
                      ...prev.prompts[i],
                      name: p.name,
                      subject: p.subject,
                    })),
                  }
                  : prev,
              );
              pageGen.setItems((prev) =>
                prev.map((it, i) => {
                  const np = next.prompts[i];
                  if (!np) return it;
                  return { ...it, name: np.name, subject: np.subject };
                }),
              );
            }}
            onApprove={() => {
              setPlanConfirmed(true);
              setPlanReviewOpen(false);
            }}
            approveLabel="Approve & start generating"
            onRegenerate={(hint) => {
              setPlanReviewOpen(false);
              planReviewAutoOpenedRef.current = false;
              void bookPlan.runPlan(hint);
            }}
            onStartOver={() => {
              setPlanReviewOpen(false);
              reset();
            }}
            regenerateChipKind={
              bookPlan.mode === "story" ? "story" : "coloring"
            }
          />
        )}
      </>
    );
  }

  const { plan, mode, age, aspectRatio } = bookPlan;
  const {
    cover,
    backCover,
    belongsTo,
    theEndPage,
    coverStyle,
    coverBorder,
    coverModel,
    interiorModel,
    belongsToStyle,
  } = coverGen;
  const { items } = pageGen;
  const { characterLock } = characterLockHook;
  const {
    refine,
    refineStatus,
    refineOpenNonce,
    openRefine,
    closeRefine,
    handleBackgroundChange,
  } = refineState;
  const { pdfBuilding } = download;

  const planReviewData: PlanReviewData | null = plan
    ? {
      title: plan.title,
      coverTitle: plan.coverTitle,
      description: plan.description,
      scene: plan.scene,
      coverScene: plan.coverScene,
      theEndMessage: mode === "story" ? plan.theEndMessage : undefined,
      characters: mode === "story" ? plan.characters : undefined,
      prompts: plan.prompts.map((p) => ({
        name: p.name,
        subject: p.subject,
        dialogue: p.dialogue,
        narration: p.narration,
      })),
    }
    : null;

  const planReviewModeNotice =
    mode === "story"
      ? "Story-book pages render with locked characters + palette + the dialogue / narration shown per page below."
      : undefined;

  const handlePlanReviewSave = (next: PlanReviewData) => {
    bookPlan.setPlan((prev) =>
      prev
        ? {
          ...prev,
          title: next.title ?? prev.title,
          coverTitle: next.coverTitle ?? prev.coverTitle,
          description: next.description ?? prev.description,
          scene: next.scene ?? prev.scene,
          coverScene: next.coverScene ?? prev.coverScene,
          theEndMessage: next.theEndMessage ?? prev.theEndMessage,
          prompts: next.prompts.map((p, i) => ({
            ...prev.prompts[i],
            name: p.name,
            subject: p.subject,
          })),
        }
        : prev,
    );
    pageGen.setItems((prev) =>
      prev.map((it, i) => {
        const np = next.prompts[i];
        if (!np) return it;
        return { ...it, name: np.name, subject: np.subject };
      }),
    );
  };

  return (
    <div className="space-y-6">
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
                    onClick={() => void characterLockHook.extractCharacterLock()}
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
            <div className="mt-4 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
              <motion.div
                className="h-full bg-white"
                animate={{
                  width: `${(progress.doneCount / Math.max(1, progress.total)) * 100}%`,
                }}
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
            onChange={coverGen.setCoverModel}
            title="Image model used for the front and back cover. Pro is the default — Amazon thumbnails reward fidelity."
          />
          <ModelPicker
            label="Pages"
            value={interiorModel}
            options={INTERIOR_MODEL_OPTIONS}
            onChange={coverGen.setInteriorModel}
            title="Image model used for interior pages and the 'this book belongs to' page. 3.1 Flash is the workhorse default — keeps cost predictable on bulk runs."
          />
          {planReviewData && (
            <div className="ml-auto">
              <PlanReviewButton
                data={planReviewData}
                modeNotice={planReviewModeNotice}
                onSave={handlePlanReviewSave}
              />
            </div>
          )}
        </div>
      )}

      {plan && (
        <CoverPair
          bookSlug={(plan.coverTitle ?? plan.title ?? "book")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}
          title={plan.coverTitle ?? plan.title ?? "Coloring book"}
          description={plan.description ?? plan.coverScene}
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
          backCoverAction={
            progress.doneCount >= 4 ? (
              <button
                type="button"
                onClick={() => setGridEditorOpen(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white hover:shadow-lg transition-all"
                title="Design the back cover from your interior pages"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                {backCoverDesign ? "Edit back cover" : "Design back cover"}
              </button>
            ) : undefined
          }
          coverStyle={coverStyle}
          coverBorder={coverBorder}
          onCoverStyleChange={coverGen.setCoverStyle}
          onCoverBorderChange={coverGen.setCoverBorder}
          onRegenerateFront={() => void coverGen.generateCover()}
          onRegenerateBack={() => setGridEditorOpen(true)}
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
                coverGen.setCover({
                  status: "done",
                  dataUrl: d,
                  model: cover.model ?? coverModel,
                }),
            });
          }}
          onRefineBack={() => setGridEditorOpen(true)}
          onViewFront={(dataUrl) => openStoryPreview(dataUrl, "Front cover")}
          onViewBack={(dataUrl) => openStoryPreview(dataUrl, "Back cover")}
          belongsTo={mode === "story" ? undefined : belongsTo}
          belongsToStyle={mode === "story" ? undefined : belongsToStyle}
          onBelongsToStyleChange={
            mode === "story" ? undefined : coverGen.setBelongsToStyle
          }
          onRegenerateBelongsTo={
            mode === "story"
              ? undefined
              : () => void coverGen.generateBelongsToPage()
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
                    coverGen.setBelongsTo({
                      status: "done",
                      dataUrl: d,
                      model: belongsTo.model ?? interiorModel,
                    }),
                  quality: belongsTo.quality,
                })
          }
          theEndPage={mode === "story" ? theEndPage : undefined}
          theEndMessage={
            mode === "story" ? plan?.theEndMessage : undefined
          }
          onRegenerateTheEnd={
            mode === "story"
              ? () => void coverGen.generateTheEndPage()
              : undefined
          }
          onRefineTheEnd={
            mode === "story"
              ? (dataUrl) =>
                openRefine({
                  context: "story-page",
                  targetId: "the-end",
                  dataUrl,
                  title: "The End",
                  subtitle:
                    "Final story page — the locked characters say one closing line. Refine to tweak the lettering, characters, scene, or message.",
                  downloadName: "the_end.png",
                  model: theEndPage.model ?? interiorModel,
                  onRefined: (d) =>
                    coverGen.setTheEndPage({
                      status: "done",
                      dataUrl: d,
                      model: theEndPage.model ?? interiorModel,
                    }),
                  quality: theEndPage.quality,
                })
              : undefined
          }
          onViewTheEnd={
            mode === "story"
              ? (dataUrl) => openStoryPreview(dataUrl, "The End page")
              : undefined
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
                onClick={pageGen.startGeneration}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95 shadow-md"
              >
                <Play className="w-4 h-4" /> Start generating
              </button>
            )}
            {phase === "generating" && !pdfBuilding && (
              <>
                <button
                  onClick={pageGen.pause}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 backdrop-blur border border-white/20"
                >
                  <Pause className="w-4 h-4" /> Pause
                </button>
                <button
                  onClick={pageGen.cancel}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-red-500/15 text-red-200 hover:bg-red-500/25 border border-red-500/30"
                >
                  <Square className="w-3.5 h-3.5" /> Cancel
                </button>
              </>
            )}
            {phase === "paused" && !pdfBuilding && (
              <>
                <button
                  onClick={pageGen.resume}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white hover:opacity-95 shadow-md"
                >
                  <Play className="w-4 h-4" /> Resume
                </button>
                <button
                  onClick={pageGen.cancel}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-red-500/15 text-red-200 hover:bg-red-500/25 border border-red-500/30"
                >
                  <Square className="w-3.5 h-3.5" /> Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {plan && allDone && (
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:items-center lg:gap-2">
          <div className="hidden lg:block" aria-hidden />
          <div className="hidden md:flex justify-center order-2 lg:order-none">
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
          <div className="flex justify-center lg:justify-end items-center gap-3 flex-wrap order-3 lg:order-none">
            <SaveBookButton
              plan={plan!}
              mode={mode}
              age={age}
              aspectRatio={aspectRatio}
              coverStyle={coverStyle}
              coverBorder={coverBorder}
              belongsToStyle={mode === "qa" ? belongsToStyle : undefined}
              cover={{ dataUrl: cover.dataUrl }}
              backCover={{ dataUrl: backCover.dataUrl }}
              belongsTo={
                mode === "qa" ? { dataUrl: belongsTo.dataUrl } : undefined
              }
              theEndPage={
                mode === "story" ? { dataUrl: theEndPage.dataUrl } : undefined
              }
              pages={items}
              characterLock={characterLock.block ?? null}
              disabled={!allDone || pdfBuilding}
            />
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
          className="rounded-3xl p-4 md:p-6 bg-zinc-900/60 backdrop-blur-xl border border-white/10 relative min-h-[500px] md:min-h-[620px]"
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
                  theEndPage={
                    mode === "story" &&
                      theEndPage.status === "done" &&
                      theEndPage.dataUrl
                      ? { imageUrl: theEndPage.dataUrl }
                      : undefined
                  }
                  pages={items.map((it, i) => ({
                    imageUrl: it.dataUrl,
                    label: `${it.name} · Page ${i + 1}`,
                    bubbles:
                      mode === "story" && !it.bubblesFlattened
                        ? it.bubbles
                        : undefined,
                  }))}
                  alternateBlankPages={mode !== "story"}
                  fullBleedInterior={mode === "story"}
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
                  onCoverStyleChange={coverGen.setCoverStyle}
                  onCoverBorderChange={coverGen.setCoverBorder}
                  onEditPrompt={(id, patch) =>
                    pageGen.updatePromptText(id, patch)
                  }
                  onRemove={pageGen.removeItem}
                  onRegenerateItem={pageGen.regeneratePage}
                  onRegenerateCover={coverGen.generateCover}
                  onRegenerateBackCover={async () => {
                    setGridEditorOpen(true);
                  }}
                  onOpenRefine={(kind, payload) => {
                    const sourceModel: ImageModel | undefined =
                      kind === "cover"
                        ? cover.model ?? coverModel
                        : kind === "back-cover"
                          ? backCover.model ?? coverModel
                          : (items.find((it) => it.id === payload.targetId)
                            ?.model ?? interiorModel);
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
                    coverGen.setCover((c) => ({
                      status: "done",
                      dataUrl,
                      model: c.model ?? coverModel,
                    }))
                  }
                  onSetBackCover={(dataUrl) =>
                    coverGen.setBackCover((c) => ({
                      status: "done",
                      dataUrl,
                      model: c.model ?? coverModel,
                    }))
                  }
                  onSetItem={(id, dataUrl) =>
                    pageGen.setItems((prev) =>
                      prev.map((it) =>
                        it.id === id
                          ? { ...it, status: "done", dataUrl }
                          : it,
                      ),
                    )
                  }
                  onUpdateBubbles={(id, bubbles) =>
                    pageGen.updateItem(id, { bubbles })
                  }
                  onStartGeneration={pageGen.startGeneration}
                  onApplyBubbleStyleToBook={(style) => {
                    bookBubbleStyleRef.current = style;
                    let touchedPages = 0;
                    let touchedBubbles = 0;
                    pageGen.setItems((prev) =>
                      prev.map((it) => {
                        if (!it.bubbles || it.bubbles.length === 0) return it;
                        touchedPages += 1;
                        touchedBubbles += it.bubbles.length;
                        return {
                          ...it,
                          bubbles: it.bubbles.map((b) =>
                            applyBubbleStyle(b, style),
                          ),
                        };
                      }),
                    );
                    if (touchedPages > 0) {
                      toast.success(
                        `Style applied to ${touchedBubbles} bubble${touchedBubbles === 1 ? "" : "s"} across ${touchedPages} page${touchedPages === 1 ? "" : "s"}.`,
                      );
                    } else {
                      toast.info(
                        "No other pages have editable bubbles yet. Generate or add bubbles on each page first.",
                      );
                    }
                  }}
                  bookTitle={plan?.coverTitle ?? plan?.title}
                  coverScene={plan?.coverScene}
                  characterLockBlock={characterLock.block}
                  refineStatus={refineStatus}
                  mode={mode}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}

      <FeedbackSurveyModal
        open={surveyOpen}
        onOpenChange={setSurveyOpen}
        bookKind={bookPlan.bookKind}
        bookTitle={bookPlan.plan?.coverTitle ?? bookPlan.plan?.title}
      />

      <ImageRefineModal
        open={refine.open}
        onClose={closeRefine}
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
        onBackgroundChange={handleBackgroundChange}
        frontCoverDataUrl={cover.dataUrl}
        bookTitle={plan?.coverTitle ?? plan?.title}
        coverScene={plan?.coverScene}
        bookDescription={plan?.description}
        pageSubjects={items.map((it) => it.subject).filter(Boolean).slice(0, 12)}
        pageCount={items.length}
        bubbles={items.find((it) => it.id === refine.targetId)?.bubbles}
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

      <ImagePreviewDialog
        open={storyPreview.open}
        onClose={() => setStoryPreview((p) => ({ ...p, open: false }))}
        src={storyPreview.src}
        alt={storyPreview.label}
        caption={`${storyPreview.label} — full preview. Story-book refine is coming soon. To change this image, use the regenerate button on the card.`}
      />

      {plan && allDone && (
        <KdpMetadataPanel
          bookName={plan.coverTitle ?? plan.title ?? "book"}
          pageCount={items.length}
          draft={listing.listingDraft}
          status={listing.listingStatus}
          errors={listing.listingErrors}
          onGenerate={(platform) => void listing.generateMetadata(platform)}
        />
      )}
      {plan && !allDone && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-xs text-violet-200">
          🔒 KDP Metadata generator unlocks once all {items.length} pages are
          generated. Currently {progress.doneCount}/{progress.total} done.
        </div>
      )}

      {gridEditorOpen && (
        <BackCoverEditorModal
          aspect={mode === "story" ? "2 / 3" : "3 / 4"}
          available={toSelectableImages(items)}
          frontCoverDataUrl={cover.dataUrl}
          bookTitle={plan?.coverTitle ?? plan?.title ?? "Coloring book"}
          coverScene={plan?.coverScene ?? plan?.scene}
          bookDescription={plan?.description}
          audience={AGE_LABELS[age]}
          pageCount={items.length}
          bookKind={mode === "story" ? "story" : "coloring"}
          initialDesign={backCoverDesign ?? undefined}
          onClose={() => setGridEditorOpen(false)}
          onApply={({ dataUrl, design }) => {
            setBackCoverDesign(design);
            coverGen.setBackCover({
              status: "done",
              dataUrl,
              model: backCover.model ?? coverModel,
            });
            setGridEditorOpen(false);
          }}
        />
      )}
    </div>
  );
}
