"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption<V extends string> {
  value: V;
  label: string;
  /** Optional one-line tooltip / inline description. */
  hint?: string;
}

interface SelectFieldProps<V extends string> {
  value: V;
  options: readonly SelectOption<V>[];
  onChange: (next: V) => void;
  disabled?: boolean;
  /** Native title for the trigger (tooltip). */
  title?: string;
  /** Aria-label / accessible name for the trigger. */
  ariaLabel?: string;
  /** Tailwind class for the trigger wrapper width. Defaults to `w-full`. */
  className?: string;
}

/**
 * Custom dark-theme dropdown matching ModelPicker's visual language. Used
 * by form fields where the OS-native `<select>` renders as a white box
 * that breaks the dark UI. Generic over the value type so any string-
 * union enum can plug in.
 *
 * Behavior:
 *   - Click trigger to open. Click an option to select.
 *   - ESC closes. Outside-click closes.
 *   - ArrowUp / ArrowDown navigate while open. Enter / Space select.
 *   - Renders selection with a check-mark; current option is highlighted.
 */
export function SelectField<V extends string>({
  value,
  options,
  onChange,
  disabled,
  title,
  ariaLabel,
  className,
}: SelectFieldProps<V>) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value),
    ),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setHighlight(
        Math.max(
          0,
          options.findIndex((o) => o.value === value),
        ),
      );
    }
  }, [open, options, value]);

  function commit(next: V) {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowUp" ||
      e.key === "Enter" ||
      e.key === " "
    ) {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onPanelKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(options.length - 1, h + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setHighlight(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setHighlight(options.length - 1);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const next = options[highlight];
      if (next) commit(next.value);
    }
  }

  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={containerRef} className={cn("relative", className ?? "w-full")}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        title={title}
        className={cn(
          "w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium",
          "bg-black/40 text-white border border-white/10 backdrop-blur",
          "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60",
          disabled
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer hover:border-violet-500/40",
        )}
      >
        <span className="font-semibold truncate">{current?.label}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "w-3.5 h-3.5 text-white/70 transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="listbox"
          tabIndex={-1}
          onKeyDown={onPanelKeyDown}
          ref={(el) => el?.focus()}
          className={cn(
            "absolute z-50 mt-1.5 left-0 right-0 py-1",
            "rounded-xl border border-white/15 bg-zinc-950/95 backdrop-blur-xl",
            "shadow-2xl shadow-black/50 ring-1 ring-white/5",
            "focus:outline-none",
          )}
        >
          {options.map((opt, i) => {
            const selected = opt.value === value;
            const highlighted = i === highlight;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => commit(opt.value)}
                className={cn(
                  "w-full flex items-start gap-2 pl-2.5 pr-3 py-2 text-left",
                  "text-xs text-white transition-colors",
                  highlighted ? "bg-violet-500/25" : "hover:bg-white/10",
                )}
              >
                <Check
                  aria-hidden
                  className={cn(
                    "w-3.5 h-3.5 shrink-0 mt-0.5",
                    selected ? "text-violet-300" : "text-transparent",
                  )}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block",
                      selected ? "font-semibold" : "font-medium",
                    )}
                  >
                    {opt.label}
                  </span>
                  {opt.hint && (
                    <span className="block text-[10px] text-neutral-400 leading-snug mt-0.5">
                      {opt.hint}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
