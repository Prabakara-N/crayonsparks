"use client";

import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCyclingStatus,
  useFakeProgress,
  ProgressFill,
} from "@/components/playground/progress-status";
import {
  STORY_PLAN_STAGES,
  COLORING_PLAN_STAGES,
} from "./book-studio-constants";

export function PlanButton({
  onClick,
  disabled,
  planning,
  isStory,
}: {
  onClick: () => void;
  disabled: boolean;
  planning: boolean;
  isStory: boolean;
}) {
  const stages = isStory ? STORY_PLAN_STAGES : COLORING_PLAN_STAGES;
  const status = useCyclingStatus(stages, planning, 1800);
  const pct = useFakeProgress(planning, isStory ? 14000 : 10000);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all overflow-hidden",
        isStory
          ? "bg-linear-to-r from-cyan-500 via-teal-400 to-emerald-400 shadow-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/60"
          : "bg-linear-to-r from-violet-500 via-indigo-400 to-cyan-400 shadow-violet-500/40 hover:shadow-xl hover:shadow-violet-500/60",
      )}
    >
      {planning && <ProgressFill pct={pct} />}
      <span className="relative inline-flex items-center gap-2">
        {planning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {status}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {isStory ? "Plan my story book" : "Plan my book with AI"}
          </>
        )}
      </span>
    </button>
  );
}
