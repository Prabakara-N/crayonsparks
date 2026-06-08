"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  value: string;
  options: ReadonlyArray<SelectOption>;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SelectDropdown({
  value,
  options,
  onChange,
  disabled,
  className,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full inline-flex h-10 items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/50 px-3 text-sm text-white transition-colors hover:border-violet-500/40",
          open && "border-violet-500/60",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span className="truncate text-left">{current?.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-neutral-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-white/15 bg-zinc-950 py-1 shadow-2xl shadow-black/60"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                role="option"
                aria-selected={active}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-violet-500/15 text-white"
                    : "text-neutral-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <span className="truncate">{o.label}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0 text-violet-300" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
