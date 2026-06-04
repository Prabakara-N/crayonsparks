"use client";

import { useEffect } from "react";
import { RotateCcw, Scale, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityCounts, ActivityType } from "@/lib/activities/types";
import { READING_TYPES } from "@/lib/activities/sequence";
import { PLANNABLE_TYPE_META } from "./activity-types-config";
import { ActivityCountStepper } from "./activity-count-stepper";

interface ActivityCountPickerProps {
  counts: ActivityCounts;
  onChange: (next: ActivityCounts) => void;
  pageCount: number;
  setPageCount: (n: number) => void;
  age?: "toddlers" | "kids" | "tweens";
}

const MAX_PAGES = 50;

function setCount(counts: ActivityCounts, type: ActivityType, value: number): ActivityCounts {
  const next = { ...counts };
  if (value > 0) next[type] = value;
  else delete next[type];
  return next;
}

export function ActivityCountPicker({ counts, onChange, pageCount, setPageCount, age }: ActivityCountPickerProps) {
  const visible = PLANNABLE_TYPE_META.filter(
    (m) => !(age === "toddlers" && READING_TYPES.includes(m.type)),
  );
  const total = visible.reduce((sum, m) => sum + (counts[m.type] ?? 0), 0);
  const selectedCount = visible.filter((m) => (counts[m.type] ?? 0) > 0).length;
  const showStepper = selectedCount >= 2;

  // In stepper mode the per-activity counts ARE the exact page counts and must
  // sum to the total. Whenever they don't (just entered stepper mode, or the
  // page slider moved), redistribute the total evenly across the selected
  // activities so the steppers always match the book.
  useEffect(() => {
    if (!showStepper || total === pageCount) return;
    const selected = visible.filter((m) => (counts[m.type] ?? 0) > 0).map((m) => m.type);
    if (!selected.length) return;
    const base = Math.floor(pageCount / selected.length);
    let rem = pageCount - base * selected.length;
    const next: ActivityCounts = {};
    for (const t of selected) {
      let v = base;
      if (rem > 0) {
        v += 1;
        rem -= 1;
      }
      if (v > 0) next[t] = v;
    }
    onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount, showStepper, total]);

  // Stepper +/- changes the activity count AND the total page count by the same
  // amount, so the counts always sum to the page count and a "+" grows the book.
  const changeCount = (type: ActivityType, value: number) => {
    const old = counts[type] ?? 0;
    onChange(setCount(counts, type, value));
    if (showStepper) {
      setPageCount(Math.max(2, Math.min(MAX_PAGES, pageCount + (value - old))));
    }
  };

  const evenSplit = () => {
    const n = visible.length;
    const base = Math.floor(pageCount / n);
    let rem = pageCount - base * n;
    const next: ActivityCounts = {};
    for (const m of visible) {
      let v = base;
      if (rem > 0) {
        v += 1;
        rem -= 1;
      }
      if (v > 0) next[m.type] = v;
    }
    onChange(next);
  };

  const surpriseMe = () => {
    const pool = visible.map((m) => m.type);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const k = Math.min(pool.length, pageCount, 3 + Math.floor(Math.random() * 3));
    const chosen = pool.slice(0, k);
    const next: ActivityCounts = {};
    for (const t of chosen) next[t] = 1;
    let left = pageCount - chosen.length;
    while (left > 0) {
      const t = chosen[Math.floor(Math.random() * chosen.length)];
      next[t] = (next[t] ?? 0) + 1;
      left -= 1;
    }
    onChange(next);
  };

  const statusText = !showStepper
    ? total === 0
      ? `Auto mix — we'll spread activity types evenly across your ${pageCount} pages. Tap to choose specific ones.`
      : `This activity fills all ${pageCount} pages. Add another to set exact page counts.`
    : `${pageCount}-page book — set exactly how many pages each activity gets. Adding pages grows the book.`;

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
          Pages per activity
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={evenSplit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/15 text-neutral-300 hover:bg-white/5 transition-colors"
          >
            <Scale className="w-3.5 h-3.5" />
            Even split
          </button>
          {total > 0 && (
            <button
              type="button"
              onClick={() => onChange({})}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/15 text-neutral-300 hover:bg-white/5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={surpriseMe}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white border border-transparent shadow hover:opacity-95 transition-opacity"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Surprise me
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-neutral-400">{statusText}</p>
        {showStepper && (
          <span className="shrink-0 rounded-lg px-2 py-1 font-mono text-xs font-semibold bg-emerald-500/20 text-emerald-200">
            {pageCount} pages
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {visible.map((meta) => (
          <ActivityCountStepper
            key={meta.type}
            label={meta.label}
            blurb={meta.blurb}
            icon={meta.icon}
            value={counts[meta.type] ?? 0}
            canIncrement={pageCount < MAX_PAGES}
            showStepper={showStepper}
            onChange={(v) => changeCount(meta.type, v)}
          />
        ))}
      </div>
    </div>
  );
}
