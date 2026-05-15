"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Horizontally scrollable category bar with left/right arrow buttons that fade at scroll boundaries.
export function CategoryScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const recompute = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    recompute();
    const onResize = () => recompute();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recompute]);

  function scrollBy(amount: number) {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({
      left: Math.max(0, Math.min(max, el.scrollLeft + amount)),
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={recompute}
        className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide items-center scroll-smooth"
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="Scroll categories left"
        onClick={() => scrollBy(-300)}
        disabled={!canLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-full bg-zinc-900 border border-white/15 flex items-center justify-center text-neutral-200 hover:bg-zinc-800 disabled:opacity-0 disabled:pointer-events-none transition-opacity shadow-lg"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        aria-label="Scroll categories right"
        onClick={() => scrollBy(300)}
        disabled={!canRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-9 w-9 rounded-full bg-zinc-900 border border-white/15 flex items-center justify-center text-neutral-200 hover:bg-zinc-800 disabled:opacity-0 disabled:pointer-events-none transition-opacity shadow-lg"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
