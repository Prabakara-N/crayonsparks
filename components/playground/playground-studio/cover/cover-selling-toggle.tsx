"use client";

import { cn } from "@/lib/utils";

interface CoverSellingToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function CoverSellingToggle({
  value,
  onChange,
  disabled,
}: CoverSellingToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-left transition-colors hover:border-violet-500/40 disabled:opacity-60"
    >
      <span>
        <span className="block text-sm font-medium text-white">
          Add selling badges
        </span>
        <span className="block text-[11px] text-neutral-400">
          Age band, count seal, marketing strip & plaque baked into the art
        </span>
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          value ? "bg-violet-500" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            value && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}
