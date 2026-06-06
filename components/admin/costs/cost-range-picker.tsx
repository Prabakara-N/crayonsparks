"use client";

import { useState } from "react";
import { COST_RANGE_PRESETS, type CostRangeId } from "./cost-range-config";
import { CostDateRangePopover } from "./cost-date-range-popover";

const DEFAULT_PRESET =
  COST_RANGE_PRESETS.find((p) => p.id === "30d") ?? COST_RANGE_PRESETS[0];

const DAY = 24 * 60 * 60 * 1000;

interface CostRangePickerProps {
  selected: CostRangeId;
  onChange: (id: CostRangeId, fromMs: number, toMs: number) => void;
}

export function CostRangePicker({ selected, onChange }: CostRangePickerProps) {
  const [custom, setCustom] = useState<{ fromMs: number; toMs: number } | null>(
    null,
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div
        role="tablist"
        aria-label="Time range"
        className="inline-flex flex-wrap p-1 rounded-2xl border border-white/10 bg-zinc-900/60"
      >
        {COST_RANGE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={selected === p.id}
            onClick={() => onChange(p.id, Date.now() - p.days * DAY, Date.now())}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
              selected === p.id
                ? "bg-amber-500/20 text-amber-100"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <CostDateRangePopover
        active={selected === "custom"}
        fromMs={custom?.fromMs ?? null}
        toMs={custom?.toMs ?? null}
        onApply={(fromMs, toMs) => {
          setCustom({ fromMs, toMs });
          onChange("custom", fromMs, toMs);
        }}
        onClear={() => {
          setCustom(null);
          onChange(
            DEFAULT_PRESET.id,
            Date.now() - DEFAULT_PRESET.days * DAY,
            Date.now(),
          );
        }}
      />
    </div>
  );
}
