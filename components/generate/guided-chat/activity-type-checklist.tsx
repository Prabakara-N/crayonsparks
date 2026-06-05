"use client";

import { useState } from "react";
import { PLANNABLE_TYPES, type ActivityType } from "@/lib/activities/types";
import { ACTIVITY_TYPE_META } from "@/components/playground/activity-book/activity-types-config";

interface ActivityTypeChecklistProps {
  initial: ActivityType[];
  onApply: (types: ActivityType[]) => void;
  onCancel: () => void;
}

export function ActivityTypeChecklist({
  initial,
  onApply,
  onCancel,
}: ActivityTypeChecklistProps) {
  const [selected, setSelected] = useState<Set<ActivityType>>(
    () => new Set(initial),
  );

  const toggle = (t: ActivityType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-neutral-400">
        Tick the activities to include, then rebuild the plan.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-1">
        {PLANNABLE_TYPES.map((t) => {
          const on = selected.has(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left transition-colors ${
                on
                  ? "bg-violet-500/15 border-violet-500/40 text-violet-100"
                  : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 text-[9px] ${
                  on
                    ? "bg-violet-500 border-violet-500 text-white"
                    : "border-white/30"
                }`}
              >
                {on ? "✓" : ""}
              </span>
              {ACTIVITY_TYPE_META[t]?.label ?? t}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          onClick={() => onApply([...selected])}
          disabled={selected.size === 0}
          className="ml-auto px-4 py-1.5 rounded-lg text-xs font-semibold bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50"
        >
          Rebuild with these
        </button>
      </div>
    </div>
  );
}
