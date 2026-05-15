"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import type { PlanReviewData } from "./types";
import { PlanReviewModal } from "./plan-review-modal";

interface PlanReviewButtonProps {
  data: PlanReviewData;
  modeNotice?: string;
  variant?: "compact" | "wide";
  onSave?: (next: PlanReviewData) => void;
}

// Single button that opens a modal with the structured plan review.
export function PlanReviewButton({
  data,
  modeNotice,
  variant = "compact",
  onSave,
}: PlanReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const total = data.prompts.length;

  // Compact variant matches the ModelPicker pill style; wide is the legacy stretched style.
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
