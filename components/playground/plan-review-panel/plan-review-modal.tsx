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
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { PlanReviewData } from "./types";
import { EditableField } from "./editable-field";
import { PlanSection } from "./plan-section";

interface PlanReviewModalProps {
  open: boolean;
  onClose: () => void;
  data: PlanReviewData;
  modeNotice?: string;
  onSave?: (next: PlanReviewData) => void;
  onApprove?: () => void;
  approveLabel?: string;
  onRegenerate?: (hint?: string) => void;
  onStartOver?: () => void;
  regenerateChipKind?: "story" | "coloring";
}

const STORY_REGENERATE_CHIPS: ReadonlyArray<{
  label: string;
  phrase: string;
}> = [
  { label: "Different characters", phrase: "use different characters" },
  { label: "Different setting", phrase: "set the story in a different place" },
  { label: "More humor", phrase: "make it funnier with light, kid-safe gags" },
  { label: "Calmer tone", phrase: "use a calmer, gentler pacing" },
  { label: "Shorter scenes", phrase: "make each scene shorter and punchier" },
  { label: "More dialogue", phrase: "use more speech bubbles per page" },
  { label: "Less dialogue", phrase: "use less dialogue, lean on narration" },
  {
    label: "Different protagonist",
    phrase: "use a different protagonist species",
  },
];

const COLORING_REGENERATE_CHIPS: ReadonlyArray<{
  label: string;
  phrase: string;
}> = [
  { label: "Different theme", phrase: "use a different theme/topic" },
  {
    label: "Different subjects",
    phrase: "use different per-page subjects",
  },
  {
    label: "Simpler pages",
    phrase: "make the page designs simpler with fewer elements",
  },
  {
    label: "More detail",
    phrase: "add more detail and supporting elements per page",
  },
  {
    label: "More variety",
    phrase: "use more variety across the pages — different sub-locations and props",
  },
  {
    label: "Different scene",
    phrase: "set the pages in a different world/scene",
  },
  { label: "Cuter style", phrase: "make the style cuter and friendlier" },
  { label: "Bolder outlines", phrase: "use bolder, thicker outlines" },
];

export function PlanReviewModal({
  open,
  onClose,
  data,
  modeNotice,
  onSave,
  onApprove,
  approveLabel = "Looks good — start generating",
  onRegenerate,
  onStartOver,
  regenerateChipKind = "story",
}: PlanReviewModalProps) {
  const regenerateChips =
    regenerateChipKind === "coloring"
      ? COLORING_REGENERATE_CHIPS
      : STORY_REGENERATE_CHIPS;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Editable working copy reset from props on open; edits stay local until Save.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlanReviewData>(data);
  const [regenerateMode, setRegenerateMode] = useState(false);
  const [activeChipPhrases, setActiveChipPhrases] = useState<string[]>([]);
  const [regenerateText, setRegenerateText] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(data);
      setEditing(false);
      setRegenerateMode(false);
      setActiveChipPhrases([]);
      setRegenerateText("");
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
        if (regenerateMode) {
          setRegenerateMode(false);
          return;
        }
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, editing, regenerateMode, data]);

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
  function toggleChip(phrase: string) {
    setActiveChipPhrases((prev) =>
      prev.includes(phrase)
        ? prev.filter((p) => p !== phrase)
        : [...prev, phrase],
    );
  }
  function buildRegenerateHint(): string {
    const parts = [...activeChipPhrases];
    const typed = regenerateText.trim();
    if (typed) parts.push(typed);
    return parts.join("; ");
  }
  function submitRegenerate() {
    const hint = buildRegenerateHint();
    onRegenerate?.(hint || undefined);
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

            {regenerateMode ? (
              <div className="overflow-y-auto px-6 py-5 space-y-4 text-sm">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300 inline-flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Tweak before regenerating
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-white">
                    What should be different?
                  </h3>
                  <p className="mt-1 text-[12px] text-neutral-400 leading-relaxed">
                    Pick suggestions, type your own steer, or both. Sparky
                    re-plans your book using the same brief plus your tweaks.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {regenerateChips.map((chip) => {
                    const active = activeChipPhrases.includes(chip.phrase);
                    return (
                      <button
                        key={chip.phrase}
                        type="button"
                        onClick={() => toggleChip(chip.phrase)}
                        className={`text-[12px] px-3 py-1.5 rounded-full border font-medium transition-colors ${
                          active
                            ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white border-transparent"
                            : "bg-white/5 border-white/10 text-neutral-300 hover:border-violet-500/40 hover:text-white"
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label
                    htmlFor="regenerate-text"
                    className="block text-[12px] font-semibold text-neutral-200 mb-1.5"
                  >
                    Or describe the change yourself
                  </label>
                  <textarea
                    id="regenerate-text"
                    value={regenerateText}
                    onChange={(e) => setRegenerateText(e.target.value)}
                    rows={3}
                    placeholder="e.g. make the protagonist a girl named Maya who solves a puzzle in a library"
                    className="w-full bg-black/30 border border-white/10 focus:border-violet-400 focus:outline-none rounded-xl px-3 py-2 text-neutral-100 text-[13px] leading-relaxed resize-y"
                  />
                  <p className="mt-1.5 text-[11px] text-neutral-500">
                    Skip both to roll a fresh variation with the same brief.
                  </p>
                </div>
              </div>
            ) : (
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

              {(draft.theEndMessage || (editing && canEdit)) && (
                <EditableField
                  label="Closing line (The End page)"
                  value={draft.theEndMessage}
                  editing={editing && canEdit}
                  multiline
                  onChange={(v) => patchDraft({ theEndMessage: v })}
                  placeholder="One short kid-facing line the main characters say on the final page."
                />
              )}

              {draft.characters && draft.characters.length > 0 && (
                <PlanSection label={`Main characters (${draft.characters.length})`}>
                  <ul className="rounded-xl bg-black/40 border border-white/5 divide-y divide-white/5 overflow-hidden">
                    {draft.characters.map((c, i) => (
                      <li key={i} className="px-4 py-2.5">
                        <p className="text-white font-semibold text-[13px]">
                          {c.name}
                        </p>
                        <p className="text-neutral-400 text-[12px] leading-relaxed mt-0.5">
                          {c.descriptor}
                        </p>
                      </li>
                    ))}
                  </ul>
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
                            {p.dialogue && p.dialogue.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {p.dialogue.map((line, j) => (
                                  <p
                                    key={j}
                                    className="text-[11px] text-cyan-200/90 leading-snug"
                                  >
                                    <span className="font-semibold">
                                      {line.speaker}:
                                    </span>{" "}
                                    <span className="italic">
                                      &ldquo;{line.text}&rdquo;
                                    </span>
                                  </p>
                                ))}
                              </div>
                            )}
                            {p.narration?.trim() && (
                              <p className="mt-1 text-[11px] text-violet-200/80 italic leading-snug">
                                Narration: {p.narration.trim()}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </PlanSection>
            </div>
            )}

            <footer className="px-6 py-3 border-t border-white/10 text-[11px] text-neutral-500 flex flex-wrap items-center justify-between gap-3">
              {regenerateMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => setRegenerateMode(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Back to plan
                  </button>
                  <button
                    type="button"
                    onClick={submitRegenerate}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow-md shadow-violet-500/30 hover:opacity-95 transition-opacity"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate now
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!editing && onStartOver && (
                      <button
                        type="button"
                        onClick={onStartOver}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-white/5 hover:bg-red-500/15 hover:text-red-200 border border-white/10 hover:border-red-500/30 text-neutral-300 transition-colors"
                        title="Discard this plan and reset the form"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Start over
                      </button>
                    )}
                    {!editing && onRegenerate && (
                      <button
                        type="button"
                        onClick={() => setRegenerateMode(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/40 text-violet-100 transition-colors"
                        title="Re-plan with optional tweaks"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Regenerate plan
                      </button>
                    )}
                  </div>
                  {onApprove && !editing && (
                    <button
                      type="button"
                      onClick={onApprove}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow-md shadow-violet-500/30 hover:opacity-95 transition-opacity"
                    >
                      <Check className="w-4 h-4" />
                      {approveLabel}
                    </button>
                  )}
                  {editing && (
                    <span>Edits apply when you click Save.</span>
                  )}
                </>
              )}
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
