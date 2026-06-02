"use client";

import {
  buildActivitySequence,
  summarizeSequence,
  countAnswerKeyPages,
} from "@/lib/activities/sequence";
import { ACTIVITY_TYPE_META } from "./activity-types-config";
import type { MixWeights } from "./activity-mix-picker";

interface ActivitySplitPreviewProps {
  pageCount: number;
  age: "toddlers" | "kids" | "tweens";
  weights: MixWeights;
}

export function ActivitySplitPreview({ pageCount, age, weights }: ActivitySplitPreviewProps) {
  const seq = buildActivitySequence({ pageCount, age, weights });
  const summary = summarizeSequence(seq);
  const answers = countAnswerKeyPages(seq);
  if (!summary.length) return null;

  return (
    <div className="rounded-xl border border-amber-400/25 bg-amber-500/5 p-3">
      <p className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold mb-2">
        Your {pageCount}-page book will include
      </p>
      <div className="flex flex-wrap gap-1.5">
        {summary.map((s) => (
          <span
            key={s.type}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-xs text-neutral-200"
          >
            {ACTIVITY_TYPE_META[s.type].label}
            <span className="font-mono text-amber-300">×{s.count}</span>
          </span>
        ))}
      </div>
      {answers > 0 && (
        <p className="mt-2 text-[11px] text-neutral-400">
          Plus {answers} answer-key {answers === 1 ? "page" : "pages"} grouped at the back.
        </p>
      )}
    </div>
  );
}
