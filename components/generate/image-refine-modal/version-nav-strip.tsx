"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface VersionNavStripProps {
  currentIndex: number;
  total: number;
  onIndexChange: (next: number) => void;
}

export function VersionNavStrip({
  currentIndex,
  total,
  onIndexChange,
}: VersionNavStripProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur border border-white/10 text-white text-xs">
      <button
        onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
        disabled={currentIndex === 0}
        className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
        aria-label="Previous version"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="font-mono">
        {currentIndex + 1} / {total}
      </span>
      <button
        onClick={() => onIndexChange(Math.min(total - 1, currentIndex + 1))}
        disabled={currentIndex === total - 1}
        className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
        aria-label="Next version"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
