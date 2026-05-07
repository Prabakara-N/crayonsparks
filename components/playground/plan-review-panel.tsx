"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClipboardList, Sparkles, X } from "lucide-react";

/**
 * Generic shape both BookStudio's `Plan` and Sparky AI's `BookBrief`
 * can be adapted to. Keeping the modal type-loose lets one component
 * cover both review surfaces (bulk-book studio + chat handoff) with no
 * cross-package coupling.
 */
export interface PlanReviewData {
  /** Full KDP title — shown as the secondary line below cover title. */
  title?: string;
  /** Short cover title — primary heading. Falls back to `title`. */
  coverTitle?: string;
  description?: string;
  scene?: string;
  coverScene?: string;
  prompts: Array<{ name: string; subject: string }>;
}

interface PlanReviewButtonProps {
  data: PlanReviewData;
  /**
   * Optional notice rendered ABOVE the page list inside the modal. Used
   * to surface mode-specific context (e.g. "Story-book pages also receive
   * locked characters + dialogue at render time.").
   */
  modeNotice?: string;
  /** Visual size — "compact" sits inside summary cards; "wide" stretches. */
  variant?: "compact" | "wide";
}

/**
 * Single button that opens a modal with the structured plan review.
 * Replaces the older inline-expandable panel — the click target is now
 * deliberate (a button), and the structured document gets the full
 * viewport instead of squeezing into the summary card.
 *
 * Used by both BookStudio's plan-summary card AND Sparky AI's
 * BriefPreview, so the review experience is consistent across the
 * coloring-book and story-book flows.
 */
export function PlanReviewButton({
  data,
  modeNotice,
  variant = "compact",
}: PlanReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const total = data.prompts.length;

  // Compact variant matches the ModelPicker pill style so the button can
  // sit next to the cover/pages model pickers as a third right-aligned
  // control in the same row (rounded-full pill, white/10 background,
  // white border at /20). Wide variant is the legacy stretched style.
  const buttonClass =
    variant === "wide"
      ? "w-full inline-flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-black text-sm font-semibold text-white shadow-lg shadow-black/40 hover:bg-zinc-900 transition-colors"
      : "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20 backdrop-blur transition-colors hover:bg-white/15 cursor-pointer";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <ClipboardList className="w-3.5 h-3.5 text-white/80" />
        <span className="font-semibold">Review plan</span>
        <span className="text-white/70 font-normal">
          {total} {total === 1 ? "page" : "pages"}
        </span>
      </button>

      <PlanReviewModal
        open={open}
        onClose={() => setOpen(false)}
        data={data}
        modeNotice={modeNotice}
      />
    </>
  );
}

interface PlanReviewModalProps {
  open: boolean;
  onClose: () => void;
  data: PlanReviewData;
  modeNotice?: string;
}

export function PlanReviewModal({
  open,
  onClose,
  data,
  modeNotice,
}: PlanReviewModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const total = data.prompts.length;
  const heading = data.coverTitle?.trim() || data.title?.trim() || "Plan review";
  const fullTitleDiffers =
    !!data.title && !!data.coverTitle && data.title !== data.coverTitle;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-1000 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-review-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/10">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300 inline-flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5" />
                  Plan review · {total} {total === 1 ? "page" : "pages"}
                </p>
                <h2
                  id="plan-review-title"
                  className="mt-1 text-xl md:text-2xl font-bold text-white leading-tight"
                >
                  {heading}
                </h2>
                {fullTitleDiffers && (
                  <p className="text-[12px] text-neutral-500 mt-1">
                    Full KDP title: {data.title}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close plan review"
                className="shrink-0 w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm">
              {data.description && (
                <PlanSection label="Description">
                  <p className="text-neutral-300 leading-relaxed">
                    {data.description}
                  </p>
                </PlanSection>
              )}

              {data.coverScene && (
                <PlanSection label="Cover prompt">
                  <p className="text-neutral-300 leading-relaxed">
                    {data.coverScene}
                  </p>
                </PlanSection>
              )}

              {data.scene && (
                <PlanSection label="Page-world description">
                  <p className="text-neutral-300 leading-relaxed">
                    {data.scene}
                  </p>
                </PlanSection>
              )}

              {modeNotice && (
                <div className="inline-flex items-start gap-2 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2 text-[12px] text-violet-200">
                  <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{modeNotice}</span>
                </div>
              )}

              <PlanSection label={`Page content (${total})`}>
                <div className="rounded-xl bg-black/40 border border-white/5 divide-y divide-white/5 overflow-hidden">
                  {data.prompts.map((p, i) => (
                    <div key={i} className="px-4 py-3 flex gap-3">
                      <span className="text-violet-300 font-mono text-[11px] shrink-0 mt-0.5 w-7">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-white font-semibold text-[13px] leading-tight">
                          {p.name}
                        </p>
                        <p className="text-neutral-400 text-[12px] leading-relaxed">
                          {p.subject}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </PlanSection>
            </div>

            <footer className="px-6 py-3 border-t border-white/10 text-[11px] text-neutral-500">
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] font-mono">
                Esc
              </kbd>{" "}
              to close
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function PlanSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300 mb-1.5">
        {label}
      </p>
      {children}
    </section>
  );
}
