"use client";

import { RotateCcw, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@/lib/activities/types";
import { READING_TYPES } from "@/lib/activities/sequence";
import { PLANNABLE_TYPE_META } from "./activity-types-config";

export type MixWeights = Partial<Record<ActivityType, number>>;

interface ActivityMixPickerProps {
  weights: MixWeights;
  onChange: (next: MixWeights) => void;
  age?: "toddlers" | "kids" | "tweens";
}

const WEIGHT_LABEL = ["", "Low", "More", "Most"];

export function ActivityMixPicker({ weights, onChange, age }: ActivityMixPickerProps) {
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

  // "Surprise me" picks a fresh random subset of types with random weights, so
  // it always does something. For toddlers it skips reading puzzles.
  const surpriseMe = () => {
    const pool = PLANNABLE_TYPE_META.map((m) => m.type).filter(
      (t) => !(age === "toddlers" && READING_TYPES.includes(t)),
    );
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const count = Math.min(pool.length, 4 + Math.floor(Math.random() * 4));
    const next: MixWeights = {};
    for (const t of pool.slice(0, count)) next[t] = 1 + Math.floor(Math.random() * 2);
    onChange(next);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
          Activity mix
        </p>
        <div className="flex items-center gap-2">
          {!surprise && (
            <button
              type="button"
              onClick={() => onChange({})}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/15 text-neutral-300 hover:bg-white/5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to all
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
