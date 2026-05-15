"use client";

import { cn } from "@/lib/utils";

interface OptionGroupProps<T extends string> {
  label: React.ReactNode;
  options: { value: T; label: string; sub?: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: OptionGroupProps<T>) {
  return (
    <div>
      <p className="text-xs font-medium text-neutral-400 mb-2">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                active
                  ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white border-transparent shadow"
                  : "bg-black/40 border-white/10 text-neutral-300 hover:border-violet-500/40"
              )}
            >
              {o.label}
              {o.sub && (
                <span
                  className={cn(
                    "ml-1.5 text-[10px]",
                    active ? "text-white/70" : "text-neutral-500"
                  )}
                >
                  {o.sub}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
