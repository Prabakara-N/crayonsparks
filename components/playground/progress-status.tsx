"use client";

import { useEffect, useState } from "react";

/** Cycles through `stages` while `active` is true, paused otherwise. */
export function useCyclingStatus(
  stages: readonly string[],
  active: boolean,
  intervalMs = 2500,
): string {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) {
      setIdx(0);
      return;
    }
    const t = setInterval(() => {
      setIdx((i) => Math.min(i + 1, stages.length - 1));
    }, intervalMs);
    return () => clearInterval(t);
  }, [active, intervalMs, stages.length]);
  return stages[Math.min(idx, stages.length - 1)] ?? stages[0] ?? "";
}

/** Returns a 0..1 fake progress that creeps toward 0.95 over `estimatedMs`. */
export function useFakeProgress(active: boolean, estimatedMs = 10000): number {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!active) {
      setPct(0);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = elapsed / estimatedMs;
      const next = 1 - Math.exp(-t * 2.5);
      setPct(Math.min(0.95, next));
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [active, estimatedMs]);
  return pct;
}

/** Inline left-to-right progress fill, designed to sit inside a rounded button. */
export function ProgressFill({
  pct,
  className,
}: {
  pct: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={
        "absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none " +
        (className ?? "")
      }
    >
      <span
        className="block h-full bg-white/15 transition-[width] duration-200 ease-out"
        style={{ width: `${Math.round(pct * 100)}%` }}
      />
    </span>
  );
}
