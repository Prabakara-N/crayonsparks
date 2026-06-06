"use client";

import type { LucideIcon } from "lucide-react";

interface CostSummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtext?: string;
  tone?: "amber" | "violet" | "cyan";
}

const TONE_STYLES: Record<NonNullable<CostSummaryCardProps["tone"]>, string> = {
  amber: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  violet: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  cyan: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
};

export function CostSummaryCard({
  icon: Icon,
  label,
  value,
  subtext,
  tone = "amber",
}: CostSummaryCardProps) {
  const styles = TONE_STYLES[tone];
  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span
          className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${styles}`}
        >
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
            {label}
          </p>
          <p className="font-display text-xl font-semibold text-white">
            {value}
          </p>
        </div>
      </div>
      {subtext && <p className="mt-2 text-xs text-neutral-500">{subtext}</p>}
    </div>
  );
}
