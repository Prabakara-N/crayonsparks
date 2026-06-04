"use client";

import { Check, Minus, Plus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityCountStepperProps {
  label: string;
  blurb?: string;
  icon: LucideIcon;
  value: number;
  canIncrement: boolean;
  showStepper: boolean;
  onChange: (next: number) => void;
}

export function ActivityCountStepper({
  label,
  blurb,
  icon: Icon,
  value,
  canIncrement,
  showStepper,
  onChange,
}: ActivityCountStepperProps) {
  const on = value > 0;

  // With 0-1 activities chosen, page counts are meaningless (the chosen one
  // takes every page) — so each tile is just a tap-to-select toggle. The
  // +/- steppers only appear once 2+ activities share the book.
  if (!showStepper) {
    return (
      <button
        type="button"
        title={blurb}
        onClick={() => onChange(on ? 0 : 1)}
        className={cn(
          "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
          on
            ? "border-violet-400 bg-violet-500/15 text-white"
            : "border-white/10 bg-black/30 text-neutral-300 hover:border-white/30",
        )}
      >
        <Icon className="w-5 h-5" />
        <span className="text-[11px] font-semibold leading-tight">{label}</span>
        {on && (
          <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wide text-cyan-200/80">
            <Check className="w-3 h-3" />
            Added
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      title={blurb}
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-2.5 transition-colors",
        on
          ? "border-violet-400 bg-violet-500/15 text-white"
          : "border-white/10 bg-black/30 text-neutral-300",
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-[11px] font-semibold leading-tight">{label}</span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          aria-label={`Fewer ${label}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 text-neutral-200 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="min-w-6 text-center font-mono text-sm font-semibold text-cyan-200">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={!canIncrement}
          aria-label={`More ${label}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 text-neutral-200 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
