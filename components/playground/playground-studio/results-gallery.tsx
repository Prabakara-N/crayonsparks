"use client";

import { forwardRef, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AspectRatio, Version } from "./types";

interface ResultsGalleryProps {
  versions: Version[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onOpen: () => void;
  generating: boolean;
  aspectRatio: AspectRatio;
}

export const ResultsGallery = forwardRef<HTMLDivElement, ResultsGalleryProps>(
  function ResultsGallery(
    { versions, currentIndex, onSelect, onOpen, generating, aspectRatio },
    ref,
  ) {
    const rowRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      const el = rowRef.current;
      if (!el) return;
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    }, [versions.length, generating]);
    if (versions.length === 0 && !generating) return null;
    const aspectStyle = aspectRatio.replace(":", " / ");
    const totalCount = versions.length + (generating ? 1 : 0);
    const shouldCenter = totalCount <= 2;
    return (
      <div
        ref={ref}
        className="mt-6 rounded-2xl p-5 bg-zinc-900/40 border border-white/10"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-neutral-200">
            Generations{" "}
            <span className="text-neutral-500 font-normal">
              ({versions.length})
            </span>
          </p>
          {versions.length > 0 && (
            <button
              onClick={onOpen}
              className="text-xs text-violet-300 hover:text-violet-200 font-semibold"
            >
              Open full view →
            </button>
          )}
        </div>
        <div
          ref={rowRef}
          className={cn(
            "flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory",
            shouldCenter ? "justify-center" : "justify-start",
          )}
        >
          {versions.map((v, i) => {
            const active = i === currentIndex;
            return (
              <button
                key={v.dataUrl.slice(-32) + i}
                type="button"
                onClick={() => {
                  onSelect(i);
                  onOpen();
                }}
                className={cn(
                  "shrink-0 snap-start w-[220px] md:w-[260px] rounded-xl overflow-hidden border-2 bg-white transition-all",
                  active
                    ? "border-violet-400 shadow-lg shadow-violet-500/30"
                    : "border-white/10 hover:border-violet-500/40",
                )}
                style={{ aspectRatio: aspectStyle }}
                title={v.instruction ?? "Open"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.dataUrl}
                  alt={`Generation ${i + 1}`}
                  className="w-full h-full object-contain"
                />
              </button>
            );
          })}
          {generating && (
            <div
              className="shrink-0 snap-start w-[220px] md:w-[260px] rounded-xl border border-violet-500/30 bg-linear-to-br from-violet-500/10 via-zinc-800 to-cyan-500/10 animate-pulse flex items-center justify-center text-violet-300"
              style={{ aspectRatio: aspectStyle }}
            >
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-[11px] font-semibold tracking-wide">
                  Generating…
                </span>
              </div>
            </div>
          )}
        </div>
        {versions.length > 1 && (
          <p className="text-[11px] text-neutral-500 mt-2">
            Newest on the right. Click any tile to open the full view, scroll
            sideways to see older generations.
          </p>
        )}
      </div>
    );
  },
);
