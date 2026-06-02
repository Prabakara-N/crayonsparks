"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { useDialog } from "@/components/ui/confirm-dialog";
import {
  Carousel as AppleCarousel,
  Card as AppleCard,
  type CardData,
} from "@/components/ui/apple-cards-carousel";
import { RegenerateCardButton } from "@/components/playground/regenerate-card-button";
import { BubbleEditorModal } from "./bubble-editor/bubble-editor-modal";
import { BubblePreviewOverlay } from "./bubble-editor/bubble-preview-overlay";
import type { BubbleStyleSnapshot } from "@/lib/bubble-style";
import { EditBubblesButton } from "./bubble-editor/edit-bubbles-button";
import { PageCover } from "./page-cover";
import { PageDownloadButton } from "./page-download-button";
import { RefineStatusBadge } from "./refine-status-badge";
import { StatusBadge } from "./status-badge";
import type {
  Aspect,
  CoverBorder,
  CoverStyle,
  PromptItem,
  QualityScore,
  StoryBubble,
} from "./types";

export interface CarouselProps {
  cover: {
    status: "pending" | "generating" | "done" | "error";
    dataUrl?: string;
    error?: string;
    quality?: QualityScore | null;
  };
  backCover: {
    status: "pending" | "generating" | "done" | "error";
    dataUrl?: string;
    error?: string;
    quality?: QualityScore | null;
  };
  items: PromptItem[];
  aspectRatio: Aspect;
  coverStyle: CoverStyle;
  coverBorder: CoverBorder;
  onCoverStyleChange: (s: CoverStyle) => void;
  onCoverBorderChange: (b: CoverBorder) => void;
  onEditPrompt: (id: string, patch: { name?: string; subject?: string }) => void;
  onRemove: (id: string) => void;
  onRegenerateItem: (item: PromptItem, improvementHint?: string) => Promise<void>;
  onRegenerateCover: () => Promise<void>;
  onRegenerateBackCover: () => Promise<void>;
  onOpenRefine: (
    kind: "cover" | "back-cover" | "page",
    payload: {
      targetId: string;
      dataUrl: string;
      title: string;
      subtitle?: string;
      downloadName: string;
      onRefined: (d: string) => void;
      quality?: QualityScore | null;
    },
  ) => void;
  onSetCover: (dataUrl: string) => void;
  onSetBackCover: (dataUrl: string) => void;
  onSetItem: (id: string, dataUrl: string) => void;
  onUpdateBubbles?: (id: string, bubbles: StoryBubble[]) => void;
  onStartGeneration?: () => void;
  onApplyBubbleStyleToBook?: (style: BubbleStyleSnapshot) => void;
  bookTitle?: string;
  coverScene?: string;
  characterLockBlock?: string;
  refineStatus?: Record<string, "running" | "done">;
  mode?: "qa" | "story";
}

export function Carousel({
  cover,
  backCover,
  items,
  aspectRatio,
  coverStyle,
  coverBorder,
  onCoverStyleChange,
  onCoverBorderChange,
  onEditPrompt,
  onRemove,
  onRegenerateItem,
  onRegenerateCover,
  onRegenerateBackCover,
  onOpenRefine,
  onSetCover,
  onSetBackCover,
  onSetItem,
  onUpdateBubbles,
  onApplyBubbleStyleToBook,
  onStartGeneration,
  bookTitle,
  coverScene,
  characterLockBlock,
  refineStatus,
  mode = "qa",
}: CarouselProps) {
  const isStory = mode === "story";
  const dialog = useDialog();
  // When a failed page is clicked, open a small modal that lets the user
  // edit the page's subject text and regenerate. Refine isn't useful for
  // failed pages (no image to edit), and Apple-card carousel doesn't expose
  // any inline form on the card itself.
  const [editingError, setEditingError] = useState<PromptItem | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [altLoading, setAltLoading] = useState(false);
  const [altError, setAltError] = useState<string | null>(null);
  const [altCount, setAltCount] = useState(0);
  const [editingBubblesId, setEditingBubblesId] = useState<string | null>(null);
  const editingBubblesItem = editingBubblesId
    ? items.find((it) => it.id === editingBubblesId) ?? null
    : null;
  const editingBubblesIndex = editingBubblesItem
    ? items.findIndex((it) => it.id === editingBubblesItem.id)
    : -1;

  // Fetch an AI-suggested alternative subject. Used both on modal open
  // (auto-fill the textarea) and when the user clicks "Suggest another".
  const fetchAlternative = useCallback(
    async (item: PromptItem, variantSeed: number) => {
      setAltLoading(true);
      setAltError(null);
      try {
        const res = await fetch("/api/rewrite-subject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: item.subject,
            errorHint: item.error,
            variantSeed,
            // Pass book context so the rewriter knows WHO the protagonist
            // is and doesn't swap a "lion cub" for a "fox kit". Without
            // this, the rewriter sees one page in isolation.
            bookTitle,
            coverScene,
            characterLock: characterLockBlock,
          }),
        });
        const data = (await res.json()) as {
          alternative?: string;
          error?: string;
        };
        if (!res.ok || !data.alternative) {
          throw new Error(data.error || "Couldn't get an alternative.");
        }
        setEditDraft(data.alternative);
        setAltCount(variantSeed);
      } catch (e) {
        setAltError(
          e instanceof Error ? e.message : "Couldn't get an alternative.",
        );
      } finally {
        setAltLoading(false);
      }
    },
    [bookTitle, coverScene, characterLockBlock],
  );

  // Reset state when modal closes / opens. Don't auto-fetch — user opts in
  // via the "Suggest alternative" button. Saves an OpenAI call on the
  // common case where the user just wants to tweak the original by hand.
  useEffect(() => {
    if (!editingError) {
      setEditDraft("");
      setAltError(null);
      setAltCount(0);
      return;
    }
    setEditDraft(editingError.subject);
    setAltError(null);
    setAltCount(0);
  }, [editingError]);

  const cards = useMemo<React.ReactNode[]>(() => {
    // Covers are rendered separately above the carousel via <CoverPair>.
    // The apple carousel only holds the interior page cards now.
    const interiorCards = items.map((it, i) => {
      const refineState = refineStatus?.[it.id];
      const downloadFilename = `page-${i + 1}-${it.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
      const card: CardData = {
        title: it.name,
        category: `Page ${i + 1} / ${items.length}`,
        cover: (
          <>
            <PageCover
              status={it.status}
              dataUrl={it.dataUrl}
              message={it.error ?? it.name}
              aspectClass={aspectRatio.replace(":", " / ")}
              showFrame
            />
            {isStory &&
              it.status === "done" &&
              it.dataUrl &&
              !it.bubblesFlattened &&
              it.bubbles &&
              it.bubbles.length > 0 && (
                <BubblePreviewOverlay bubbles={it.bubbles} />
              )}
            {it.status === "done" && it.dataUrl && (
              <PageDownloadButton
                dataUrl={it.dataUrl}
                filename={downloadFilename}
                bubbles={
                  isStory && !it.bubblesFlattened ? it.bubbles : undefined
                }
              />
            )}
            {isStory &&
              it.status === "done" &&
              it.dataUrl &&
              it.bubbles &&
              it.bubbles.length > 0 &&
              !it.bubblesFlattened &&
              onUpdateBubbles && (
                <EditBubblesButton
                  bubbleCount={it.bubbles.length}
                  onClick={() => setEditingBubblesId(it.id)}
                />
              )}
          </>
        ),
        badge: refineState ? (
          <RefineStatusBadge state={refineState} />
        ) : (
          <StatusBadge status={it.status} />
        ),
        action:
          it.status === "done" && !isStory ? (
            <RegenerateCardButton
              quality={it.quality}
              busy={false}
              onClick={(hint) => void onRegenerateItem(it, hint)}
            />
          ) : null,
        // content is unused now (we override onClick to open the existing
        // ImageRefineModal directly), but keep it as a fallback.
        content: null,
      };

      const handleClick = () => {
        if (it.status === "done" && it.dataUrl) {
          onOpenRefine("page", {
            targetId: it.id,
            dataUrl: it.dataUrl,
            title: it.name,
            subtitle: `Page ${i + 1} · ${it.id}`,
            downloadName: `${it.id}_${it.name.replace(/[^a-z0-9]+/gi, "_")}.png`,
            onRefined: (d) => onSetItem(it.id, d),
            quality: it.quality,
          });
        } else if (it.status === "error") {
          // Failed pages never produced an image — retrying in place is safe
          // for both modes. Story mode might see slight character drift on
          // the single retry, but that's preferable to being blocked.
          setEditingError(it);
        } else if (it.status === "generating") {
          // Don't fire a parallel regen on an in-flight page — that races
          // the bulk loop and replaces the live result with a different
          // image after the fact, which the user reads as auto-regen.
          return;
        } else {
          if (isStory) {
            const noneStartedYet = items.every(
              (page) => page.status === "pending" || page.status === "queued",
            );
            const isFirstInterior = i === 0;
            if (noneStartedYet && isFirstInterior && onStartGeneration) {
              onStartGeneration();
              return;
            }
            void dialog.alert({
              title: "Story pages generate in order",
              message:
                "Each story page references the previous one so characters stay consistent across the book. Click the first interior page (or the main Generate / Resume button) to start the chain.",
              variant: "info",
              okText: "Got it",
            });
            return;
          }
          void onRegenerateItem(it);
        }
      };

      return (
        <AppleCard
          key={`card-${i}-${card.title}`}
          card={card}
          index={i}
          onClick={handleClick}
        />
      );
    });

    // Read-only answer-key cards (activity solutions) shown after the
    // interior pages so the user can preview the back-of-book answers.
    const answerCards = items
      .filter((it) => it.status === "done" && it.solutionDataUrl)
      .map((it, j) => {
        const card: CardData = {
          title: `Answer — ${it.name}`,
          category: "Answer Key",
          cover: (
            <>
              <PageCover
                status="done"
                dataUrl={it.solutionDataUrl}
                message={it.name}
                aspectClass={aspectRatio.replace(":", " / ")}
                showFrame
              />
              <PageDownloadButton
                dataUrl={it.solutionDataUrl as string}
                filename={`answer-${it.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`}
              />
            </>
          ),
          badge: <StatusBadge status="done" />,
          action: null,
          content: null,
        };
        return (
          <AppleCard
            key={`answer-${j}-${it.id}`}
            card={card}
            index={items.length + j}
            onClick={() => {}}
          />
        );
      });

    return [...interiorCards, ...answerCards];
  }, [
    items,
    aspectRatio,
    onRegenerateItem,
    onOpenRefine,
    onSetItem,
    onUpdateBubbles,
    onStartGeneration,
    refineStatus,
    isStory,
    dialog,
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-2">
        <p className="text-sm font-semibold text-white">
          {items.length} interior pages
        </p>
        <p className="text-xs text-neutral-500">
          {isStory
            ? "Tap a done page to refine"
            : "Tap a card to refine · covers shown above"}
        </p>
      </div>
      {isStory && (
        <div className="mb-3 mx-2 rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-3 py-2 text-[11px] text-cyan-100/90 leading-relaxed">
          Story pages are linked — each one references the previous page so
          characters stay consistent. They generate in order from the main
          Generate / Resume button. Refining a finished page is OK (edits
          existing image without breaking the chain).
        </div>
      )}
      <AppleCarousel items={cards} />

      {/* Edit-prompt-and-regenerate modal for failed pages */}
      {editingError && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingError(null);
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-violet-300 font-semibold">
                  {editingError.name}
                </p>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Regenerate with a new prompt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingError(null)}
                className="p-1.5 rounded-md hover:bg-white/10 text-neutral-400 hover:text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editingError.error && (
              <div className="mb-4 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-[12px] text-red-200 leading-relaxed whitespace-pre-wrap">
                {editingError.error}
              </div>
            )}

            {/* Original prompt — read-only, for reference */}
            <div className="mb-4">
              <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                Original prompt (read-only)
              </span>
              <div className="mt-2 px-3 py-2.5 rounded-lg bg-black/40 border border-white/5 text-[13px] text-neutral-400 leading-relaxed max-h-32 overflow-y-auto">
                {editingError.subject}
              </div>
            </div>

            {/* Editable subject — starts as the original. User edits by
                hand OR clicks "Suggest alternative" to have AI rewrite it. */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] uppercase tracking-wider text-violet-300 font-semibold">
                  {altCount > 0
                    ? `AI-suggested alternative${altCount > 1 ? ` (#${altCount})` : ""}`
                    : "Edit prompt"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    editingError &&
                    void fetchAlternative(editingError, altCount + 1)
                  }
                  disabled={altLoading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-violet-500/30 bg-violet-500/10 text-violet-200 hover:text-white hover:bg-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Have AI rewrite the prompt to defang IP or safety triggers"
                >
                  {altLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {altCount === 0 ? "Suggest alternative" : "Suggest another"}
                </button>
              </div>
              <textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                rows={6}
                disabled={altLoading}
                placeholder={
                  altLoading ? "Generating an alternative…" : "Edit the prompt"
                }
                className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-violet-500/30 text-white text-sm focus:outline-none focus:border-violet-500/60 resize-y leading-relaxed disabled:opacity-60"
              />
              {altError && (
                <p className="mt-1.5 text-[11px] text-red-300">
                  {altError} — you can still edit the textarea manually.
                </p>
              )}
              {altCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    editingError && setEditDraft(editingError.subject)
                  }
                  className="mt-1.5 text-[11px] text-neutral-500 hover:text-neutral-300 underline-offset-2 hover:underline"
                >
                  Reset to original
                </button>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingError(null)}
                className="px-4 py-2 rounded-lg text-sm text-neutral-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const trimmed = editDraft.trim();
                  if (!trimmed) return;
                  const target = editingError;
                  setEditingError(null);
                  // Persist the edited subject in the items state, then
                  // kick off regeneration. regeneratePage will read the
                  // latest subject from items.
                  onEditPrompt(target.id, { subject: trimmed });
                  // The state update is async — call regenerate with the
                  // updated subject inline so it doesn't race the render.
                  void onRegenerateItem({ ...target, subject: trimmed });
                }}
                disabled={!editDraft.trim() || altLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
      {editingBubblesItem &&
        editingBubblesItem.dataUrl &&
        editingBubblesItem.bubbles &&
        onUpdateBubbles && (
          <BubbleEditorModal
            open
            onOpenChange={(o) => {
              if (!o) setEditingBubblesId(null);
            }}
            pageName={editingBubblesItem.name}
            pageIndex={editingBubblesIndex}
            totalPages={items.length}
            imageSrc={editingBubblesItem.dataUrl}
            bubbles={editingBubblesItem.bubbles}
            onChange={(next) => onUpdateBubbles(editingBubblesItem.id, next)}
            onApplyStyleToBook={onApplyBubbleStyleToBook}
          />
        )}
    </div>
  );
}
