"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  month: Date;
  onMonthChange: (next: Date) => void;
  fromMs: number | null;
  toMs: number | null;
  onPickDay: (ms: number) => void;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function MiniCalendar({
  month,
  onMonthChange,
  fromMs,
  toMs,
  onPickDay,
}: MiniCalendarProps) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const startWeekday = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dayMs = (d: number) => new Date(year, m, d).getTime();
  const isEnd = (ms: number) => ms === fromMs || ms === toMs;
  const inRange = (ms: number) =>
    fromMs != null && toMs != null && ms > fromMs && ms < toMs;

  return (
    <div className="w-64">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => onMonthChange(new Date(year, m - 1, 1))}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white">
          {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => onMonthChange(new Date(year, m + 1, 1))}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-neutral-500 mb-1">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d == null) return <span key={`pad-${i}`} />;
          const ms = dayMs(d);
          const end = isEnd(ms);
          const mid = inRange(ms);
          return (
            <button
              key={d}
              type="button"
              onClick={() => onPickDay(ms)}
              className={`h-8 rounded-lg text-xs transition-colors ${
                end
                  ? "bg-amber-500 text-black font-semibold"
                  : mid
                    ? "bg-amber-500/20 text-amber-100"
                    : "text-neutral-300 hover:bg-white/10"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
