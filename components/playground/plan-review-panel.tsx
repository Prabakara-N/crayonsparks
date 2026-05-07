"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardList,
  Pencil,
  Sparkles,
  X,
  Check,
  RotateCcw,
} from "lucide-react";

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
  /**
   * Optional save handler. When provided, the modal exposes an Edit toggle
   * so the user can rewrite plan-level fields and per-page name/subject.
   * Saved values flow back via this callback so the parent can update its
   * plan/items state and the next image generation runs on the edits.
   * Without this callback, the modal stays read-only.
   */
  onSave?: (next: PlanReviewData) => void;
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
  onSave,
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
        onSave={onSave}
      />
    </>
  );
}

interface PlanReviewModalProps {
  open: boolean;
  onClose: () => void;
  data: PlanReviewData;
  modeNotice?: string;
  onSave?: (next: PlanReviewData) => void;
}

export function PlanReviewModal({
  open,
  onClose,
  data,
  modeNotice,
  onSave,
}: PlanReviewModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Editable working copy. Initialised from props on open and reset
  // whenever the source data changes underneath us. Edits stay local
  // until the user clicks Save (which fires onSave). Cancel discards
  // them by resetting to props.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlanReviewData>(data);

  useEffect(() => {
    if (open) {
      setDraft(data);
      setEditing(false);
    }
  }, [open, data]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editing) {
          setEditing(false);
          setDraft(data);
          return;
        }
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, editing, data]);

  if (!mounted) return null;

  const total = draft.prompts.length;
  const heading =
    draft.coverTitle?.trim() || draft.title?.trim() || "Plan review";
  const fullTitleDiffers =
    !!draft.title && !!draft.coverTitle && draft.title !== draft.coverTitle;
  const canEdit = !!onSave;

  function patchDraft(patch: Partial<PlanReviewData>) {
    setDraft((d) => ({ ...d, ...patch }));
  }
  function patchPrompt(index: number, patch: { name?: string; subject?: string }) {
    setDraft((d) => ({
      ...d,
      prompts: d.prompts.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }

  function handleSave() {
    onSave?.(draft);
    setEditing(false);
  }
  function handleCancel() {
    setDraft(data);
    setEditing(false);
  }

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
                  {editing && (
                    <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-200">
                      Editing
                    </span>
                  )}
                </p>
                {editing && canEdit ? (
                  <input
                    aria-label="Cover title"
                    className="mt-1 w-full bg-transparent text-xl md:text-2xl font-bold text-white leading-tight border-b border-violet-500/30 focus:border-violet-400 focus:outline-none py-0.5"
                    value={draft.coverTitle ?? ""}
                    onChange={(e) => patchDraft({ coverTitle: e.target.value })}
                    placeholder="Cover title"
                  />
                ) : (
                  <h2
                    id="plan-review-title"
                    className="mt-1 text-xl md:text-2xl font-bold text-white leading-tight"
                  >
                    {heading}
                  </h2>
                )}
                {fullTitleDiffers && !editing && (
                  <p className="text-[12px] text-neutral-500 mt-1">
                    Full KDP title: {draft.title}
                  </p>
                )}
                {editing && canEdit && (
                  <input
                    aria-label="Full KDP title"
                    className="mt-2 w-full bg-transparent text-[12px] text-neutral-400 border-b border-white/10 focus:border-violet-400 focus:outline-none py-0.5"
                    value={draft.title ?? ""}
                    onChange={(e) => patchDraft({ title: e.target.value })}
                    placeholder="Full KDP title (optional)"
                  />
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canEdit && !editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    aria-label="Edit plan"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/40 text-violet-100 text-[12px] font-semibold transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
                {editing && (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-neutral-300 text-[12px] font-medium transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-[12px] font-semibold shadow-lg shadow-emerald-500/30 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close plan review"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm">
              <EditableField
                label="Description"
                value={draft.description}
                editing={editing && canEdit}
                multiline
                onChange={(v) => patchDraft({ description: v })}
                placeholder="Short KDP-style description of the book."
              />

              <EditableField
                label="Cover prompt"
                value={draft.coverScene}
                editing={editing && canEdit}
                multiline
                onChange={(v) => patchDraft({ coverScene: v })}
                placeholder="Scene description used to render the front cover."
              />

              <EditableField
                label="Page-world description"
                value={draft.scene}
                editing={editing && canEdit}
                multiline
                onChange={(v) => patchDraft({ scene: v })}
                placeholder="World/setting that every interior page lives in."
              />

              {modeNotice && (
                <div className="inline-flex items-start gap-2 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2 text-[12px] text-violet-200">
                  <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{modeNotice}</span>
                </div>
              )}

              <PlanSection label={`Page content (${total})`}>
                <div className="rounded-xl bg-black/40 border border-white/5 divide-y divide-white/5 overflow-hidden">
                  {draft.prompts.map((p, i) => (
                    <div key={i} className="px-4 py-3 flex gap-3">
                      <span className="text-violet-300 font-mono text-[11px] shrink-0 mt-0.5 w-7">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        {editing && canEdit ? (
                          <>
                            <input
                              aria-label={`Page ${i + 1} name`}
                              className="w-full bg-black/30 border border-white/10 focus:border-violet-400 focus:outline-none rounded px-2 py-1.5 text-white font-semibold text-[13px]"
                              value={p.name}
                              onChange={(e) =>
                                patchPrompt(i, { name: e.target.value })
                              }
                              placeholder="Page name"
                            />
                            <textarea
                              aria-label={`Page ${i + 1} subject`}
                              className="w-full bg-black/30 border border-white/10 focus:border-violet-400 focus:outline-none rounded px-2 py-1.5 text-neutral-200 text-[12px] leading-relaxed resize-y"
                              value={p.subject}
                              onChange={(e) =>
                                patchPrompt(i, { subject: e.target.value })
                              }
                              rows={2}
                              placeholder="Image-generation prompt for this page"
                            />
                          </>
                        ) : (
                          <>
                            <p className="text-white font-semibold text-[13px] leading-tight">
                              {p.name}
                            </p>
                            <p className="text-neutral-400 text-[12px] leading-relaxed">
                              {p.subject}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </PlanSection>
            </div>

            <footer className="px-6 py-3 border-t border-white/10 text-[11px] text-neutral-500 flex items-center justify-between gap-3">
              <span>
                {editing
                  ? "Edits apply when you click Save. Future page generations use the saved prompts."
                  : "Press"}{" "}
                {!editing && (
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] font-mono">
                    Esc
                  </kbd>
                )}{" "}
                {!editing && "to close"}
              </span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function EditableField({
  label,
  value,
  editing,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  editing: boolean;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  // In read-only mode, hide the section entirely when there's no value —
  // matches the previous behavior of skipping empty sections.
  if (!editing && !value?.trim()) return null;
  return (
    <PlanSection label={label}>
      {editing ? (
        multiline ? (
          <textarea
            className="w-full bg-black/30 border border-white/10 focus:border-violet-400 focus:outline-none rounded px-3 py-2 text-neutral-100 text-[13px] leading-relaxed resize-y"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={placeholder}
          />
        ) : (
          <input
            className="w-full bg-black/30 border border-white/10 focus:border-violet-400 focus:outline-none rounded px-3 py-2 text-neutral-100 text-[13px]"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        )
      ) : (
        <p className="text-neutral-300 leading-relaxed">{value}</p>
      )}
    </PlanSection>
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
