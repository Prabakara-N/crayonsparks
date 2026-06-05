"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { MiniCalendar } from "./mini-calendar";

interface CostDateRangePopoverProps {
  active: boolean;
  fromMs: number | null;
  toMs: number | null;
  onApply: (fromMs: number, toMs: number) => void;
}

const DAY = 24 * 60 * 60 * 1000;

const startOfDay = (ms: number): number => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const fmt = (ms: number): string =>
  new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function CostDateRangePopover({
  active,
  fromMs,
  toMs,
  onApply,
}: CostDateRangePopoverProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => new Date());
  const [pendFrom, setPendFrom] = useState<number | null>(
    active ? fromMs : null,
  );
  const [pendTo, setPendTo] = useState<number | null>(active ? toMs : null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function pickDay(ms: number) {
    if (pendFrom == null || pendTo != null) {
      setPendFrom(ms);
      setPendTo(null);
      return;
    }
    if (ms < pendFrom) {
      setPendFrom(ms);
      return;
    }
    setPendTo(ms);
    onApply(startOfDay(pendFrom), startOfDay(ms) + DAY - 1000);
    setOpen(false);
  }

  const label =
    active && fromMs != null && toMs != null
      ? `${fmt(fromMs)} – ${fmt(toMs)}`
      : "Custom range";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          active
            ? "border-amber-500/40 text-amber-100 bg-amber-500/10"
            : "border-white/10 text-neutral-300 hover:text-white"
        }`}
      >
        <CalendarDays className="w-3.5 h-3.5" />
        {label}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl p-3 shadow-2xl">
          <MiniCalendar
            month={month}
            onMonthChange={setMonth}
            fromMs={pendFrom}
            toMs={pendTo}
            onPickDay={pickDay}
          />
          <p className="mt-2 text-[10px] text-neutral-500">
            {pendFrom != null && pendTo == null
              ? "Pick an end date"
              : "Pick a start date"}
          </p>
        </div>
      )}
    </div>
  );
}
