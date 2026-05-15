"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageCategory } from "./types";
import { CATEGORIES } from "./playground-studio-constants";

interface CategoryDropdownProps {
  value: ImageCategory;
  onChange: (v: ImageCategory) => void;
  disabled?: boolean;
}

export function CategoryDropdown({
  value,
  onChange,
  disabled,
}: CategoryDropdownProps) {
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
  const current = CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[0];
  return (
    <div ref={ref} className="relative inline-block w-[280px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm hover:border-violet-500/40 transition-colors",
          open && "border-violet-500/60",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span className="truncate text-left">{current.label}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-neutral-400 transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute top-full mt-1 left-0 right-0 z-30 rounded-lg bg-zinc-950 border border-white/15 shadow-2xl shadow-black/60 py-1"
        >
          {CATEGORIES.map((c) => {
            const active = c.value === value;
            return (
              <button
                key={c.value}
                role="option"
                aria-selected={active}
                type="button"
                onClick={() => {
                  onChange(c.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-violet-500/15 text-white"
                    : "text-neutral-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <span className="truncate">{c.label}</span>
                {active && (
                  <Check className="w-3.5 h-3.5 text-violet-300 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
