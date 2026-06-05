"use client";

import type { LedgerCategory } from "./credit-category-filter";

export interface LedgerRowEntry {
  id: string;
  delta: number;
  reason: string;
  refKind: string;
  category: Exclude<LedgerCategory, "all">;
  createdAt: number | null;
}

const CATEGORY_BADGE: Record<Exclude<LedgerCategory, "all">, string> = {
  coloring: "bg-cyan-500/15 text-cyan-200",
  story: "bg-violet-500/15 text-violet-200",
  activity: "bg-amber-500/15 text-amber-200",
  grant: "bg-emerald-500/15 text-emerald-200",
};

export function CreditLedgerRow({ entry }: { entry: LedgerRowEntry }) {
  const positive = entry.delta > 0;
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-black/30 border border-white/5 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-neutral-200 truncate">{entry.reason}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${CATEGORY_BADGE[entry.category]}`}
          >
            {entry.category}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono">
            {entry.refKind}
            {entry.createdAt
              ? ` · ${new Date(entry.createdAt).toLocaleString()}`
              : ""}
          </span>
        </div>
      </div>
      <span
        className={`font-mono text-sm font-semibold shrink-0 ${
          positive ? "text-emerald-300" : "text-red-300"
        }`}
      >
        {positive ? "+" : ""}
        {entry.delta}
      </span>
    </li>
  );
}
