"use client";

import { Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@/lib/activities/types";
import { PLANNABLE_TYPE_META } from "./activity-types-config";

export type MixWeights = Partial<Record<ActivityType, number>>;

interface ActivityMixPickerProps {
  weights: MixWeights;
  onChange: (next: MixWeights) => void;
}

const WEIGHT_LABEL = ["", "Low", "More", "Most"];

export function ActivityMixPicker({ weights, onChange }: ActivityMixPickerProps) {
  const active = Object.values(weights).filter((w) => (w ?? 0) > 0).length;
  const surprise = active === 0;

  const cycle = (type: ActivityType) => {
    const current = weights[type] ?? 0;
    const next = (current + 1) % 4;
    const copy = { ...weights };
    if (next === 0) delete copy[type];
    else copy[type] = next;
    onChange(copy);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
          Activity mix
        </p>
        <button
          type="button"
          onClick={() => onChange({})}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
            surprise
              ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white border-transparent shadow"
              : "text-neutral-300 border-white/15 hover:bg-white/5",
          )}
        >
          <Shuffle className="w-3.5 h-3.5" />
          Surprise me (all)
        </button>
      </div>
      <p className="text-xs text-neutral-400">
        {surprise
          ? "Your book will mix every activity type evenly, interleaved with a difficulty ramp."
          : `${active} type${active === 1 ? "" : "s"} selected — click a tile to weight it Low → More → Most.`}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {PLANNABLE_TYPE_META.map((meta) => {
          const w = weights[meta.type] ?? 0;
          const on = w > 0;
          const Icon = meta.icon;
          return (
            <button
              key={meta.type}
              type="button"
              onClick={() => cycle(meta.type)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all",
                on
                  ? "border-violet-400 bg-violet-500/15 text-white"
                  : "border-white/10 bg-black/30 text-neutral-300 hover:border-white/30",
              )}
              title={meta.blurb}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold leading-tight">{meta.label}</span>
              {on && (
                <span className="absolute top-1 right-1.5 flex gap-0.5">
                  {[1, 2, 3].map((n) => (
                    <span
                      key={n}
                      className={cn("w-1.5 h-1.5 rounded-full", n <= w ? "bg-cyan-300" : "bg-white/20")}
                    />
                  ))}
                </span>
              )}
              {on && (
                <span className="text-[9px] uppercase tracking-wide text-cyan-200/80">{WEIGHT_LABEL[w]}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
