"use client";

import { useState } from "react";
import type { ActivityBookPlan } from "@/lib/book-chat";
import type { ActivityType } from "@/lib/activities/types";
import { ACTIVITY_TYPE_META } from "@/components/playground/activity-book/activity-types-config";

interface ActivityPlanPreviewProps {
  plan: ActivityBookPlan;
  onConfirm: () => void;
  onTweak: (feedback: string) => void;
}

export function ActivityPlanPreview({
  plan,
  onConfirm,
  onTweak,
}: ActivityPlanPreviewProps) {
  const [tweakOpen, setTweakOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const counts = new Map<ActivityType, number>();
  for (const p of plan.pages) counts.set(p.type, (counts.get(p.type) ?? 0) + 1);
  const breakdown = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="mt-2 rounded-2xl border border-violet-500/40 bg-linear-to-br from-violet-500/10 to-cyan-500/5 p-4 space-y-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-violet-300">
          Activity plan ready · {plan.pages.length} pages
        </div>
        <div className="text-base font-bold text-white mt-0.5">{plan.title}</div>
        {plan.description && (
          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
            {plan.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {breakdown.map(([type, n]) => (
          <span
            key={type}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-neutral-200"
          >
            {ACTIVITY_TYPE_META[type]?.label ?? type}
            <span className="text-violet-300">×{n}</span>
          </span>
        ))}
      </div>

      {tweakOpen ? (
        <div className="space-y-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="What should I change? e.g. 'make it 20 pages' or 'add more mazes, drop the crosswords'"
            className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500/60 resize-y"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => setTweakOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (feedback.trim()) onTweak(feedback.trim());
              }}
              disabled={!feedback.trim()}
              className="ml-auto px-4 py-1.5 rounded-lg text-xs font-semibold bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50"
            >
              Send revision
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-linear-to-r from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/30 hover:shadow-xl"
          >
            ✓ Looks good — open the studio
          </button>
          <button
            onClick={() => setTweakOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-violet-100 bg-white/5 border border-white/15 hover:bg-white/10"
          >
            ✏️ Tweak this
          </button>
        </div>
      )}
    </div>
  );
}
