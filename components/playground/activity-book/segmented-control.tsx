"use client";

import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string | number> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

export function SegmentedControl<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 min-w-[64px] px-3 py-2 rounded-lg text-xs font-semibold transition-colors",
              value === o.value
                ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow"
                : "text-neutral-300 hover:bg-white/5",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
