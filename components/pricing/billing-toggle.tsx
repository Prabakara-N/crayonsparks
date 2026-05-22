"use client";

import { cn } from "@/lib/utils";

export type BillingCycle = "monthly" | "annual";

interface BillingToggleProps {
  value: BillingCycle;
  onChange: (value: BillingCycle) => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-zinc-900/60 dark:bg-zinc-900/60 border border-white/10 backdrop-blur">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        aria-pressed={value === "monthly"}
        className={cn(
          "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
          value === "monthly"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-neutral-300 hover:text-white",
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("annual")}
        aria-pressed={value === "annual"}
        className={cn(
          "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors inline-flex items-center gap-1.5",
          value === "annual"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-neutral-300 hover:text-white",
        )}
      >
        Annual
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
            value === "annual"
              ? "bg-emerald-500 text-white"
              : "bg-emerald-500/15 text-emerald-300",
          )}
        >
          Save 20%
        </span>
      </button>
    </div>
  );
}
