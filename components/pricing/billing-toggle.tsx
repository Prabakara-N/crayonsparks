"use client";

import { cn } from "@/lib/utils";

export type BillingCycle = "monthly" | "annual";

interface BillingToggleProps {
  value: BillingCycle;
  onChange: (value: BillingCycle) => void;
  size?: "sm" | "default";
}

export function BillingToggle({
  value,
  onChange,
  size = "default",
}: BillingToggleProps) {
  const isSm = size === "sm";
  const buttonBase = isSm
    ? "px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
    : "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors";
  const badgeBase = isSm
    ? "text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-full"
    : "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full";

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-zinc-900/60 dark:bg-zinc-900/60 border border-white/10 backdrop-blur">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        aria-pressed={value === "monthly"}
        className={cn(
          buttonBase,
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
          buttonBase,
          "inline-flex items-center gap-1.5",
          value === "annual"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-neutral-300 hover:text-white",
        )}
      >
        Annual
        <span
          className={cn(
            badgeBase,
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
