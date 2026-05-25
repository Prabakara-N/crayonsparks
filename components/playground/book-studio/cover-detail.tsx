"use client";

import { BookPlus, Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pending } from "./pending";
import { ErrorState } from "./error-state";
import type { CarouselProps } from "./carousel";
import type { Aspect, CoverBorder, CoverStyle, QualityScore } from "./types";

export function CoverDetail({
  cover,
  aspectRatio,
  coverStyle,
  coverBorder,
  onCoverStyleChange,
  onCoverBorderChange,
  onRegenerate,
  onOpenRefine,
  onSetCover,
}: {
  cover: {
    status: "pending" | "generating" | "done" | "error";
    dataUrl?: string;
    error?: string;
    quality?: QualityScore | null;
  };
  aspectRatio: Aspect;
  coverStyle: CoverStyle;
  coverBorder: CoverBorder;
  onCoverStyleChange: (s: CoverStyle) => void;
  onCoverBorderChange: (b: CoverBorder) => void;
  onRegenerate: () => Promise<void>;
  onOpenRefine: CarouselProps["onOpenRefine"];
  onSetCover: (dataUrl: string) => void;
}) {
  return (
    <div className="grid md:grid-cols-[1fr_280px] gap-6">
      <div
        className="relative rounded-2xl overflow-hidden bg-linear-to-br from-zinc-800 to-zinc-900 border border-white/10"
        style={{ aspectRatio: "3 / 4" }}
      >
        {cover.status === "done" && cover.dataUrl ? (
          <button
            type="button"
            onClick={() =>
              onOpenRefine("cover", {
                targetId: "cover",
                dataUrl: cover.dataUrl!,
                title: "Cover",
                subtitle: "Describe changes. Gemini edits while preserving layout.",
                downloadName: "cover.png",
                onRefined: onSetCover,
                quality: cover.quality,
              })
            }
            className="absolute inset-0 w-full h-full group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.dataUrl}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-semibold">Click to refine</span>
            </div>
          </button>
        ) : cover.status === "generating" ? (
          <Pending label="Generating cover…" />
        ) : cover.status === "error" ? (
          <ErrorState message={cover.error ?? "Cover failed"} />
        ) : (
          <Pending label="Cover pending" icon={<BookPlus className="w-7 h-7" />} />
        )}
      </div>
      <div className="flex flex-col gap-4 min-w-0">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Aspect {aspectRatio}
        </p>

        {/* Cover STYLE toggle */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
            Style
          </label>
          <div className="flex gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
            {(
              [
                { value: "flat", label: "Flat cartoon", sub: "Bold & simple" },
                {
                  value: "illustrated",
                  label: "Illustrated",
                  sub: "Premium story-book",
                },
              ] as const
            ).map((opt) => {
              const active = coverStyle === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onCoverStyleChange(opt.value)}
                  className={cn(
                    "flex-1 px-2.5 py-2 rounded-lg text-xs font-semibold text-left transition-colors",
                    active
                      ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow"
                      : "text-neutral-300 hover:bg-white/5",
                  )}
                >
                  <div>{opt.label}</div>
                  <div
                    className={cn(
                      "text-[10px] font-normal mt-0.5",
                      active ? "text-white/80" : "text-neutral-500",
                    )}
                  >
                    {opt.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cover BORDER toggle */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
            Border
          </label>
          <div className="flex gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
            {(
              [
                { value: "framed", label: "Framed", sub: "Cream beige edge" },
                { value: "bleed", label: "Full bleed", sub: "Edge to edge" },
              ] as const
            ).map((opt) => {
              const active = coverBorder === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onCoverBorderChange(opt.value)}
                  className={cn(
                    "flex-1 px-2.5 py-2 rounded-lg text-xs font-semibold text-left transition-colors",
                    active
                      ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow"
                      : "text-neutral-300 hover:bg-white/5",
                  )}
                >
                  <div>{opt.label}</div>
                  <div
                    className={cn(
                      "text-[10px] font-normal mt-0.5",
                      active ? "text-white/80" : "text-neutral-500",
                    )}
                  >
                    {opt.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          The cover combines key characters from your book on a themed
          background. Click the image to refine specific details.
        </p>
        <button
          type="button"
          onClick={() => void onRegenerate()}
          disabled={cover.status === "generating"}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-linear-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg disabled:opacity-60 transition-all"
        >
          {cover.status === "generating" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {cover.status === "done" ? "Regenerate cover" : "Generate cover"}
        </button>
      </div>
    </div>
  );
}
