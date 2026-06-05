"use client";

export type LedgerCategory =
  | "all"
  | "coloring"
  | "story"
  | "activity"
  | "grant";

const OPTIONS: Array<{ value: LedgerCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "coloring", label: "Coloring" },
  { value: "story", label: "Story" },
  { value: "activity", label: "Activity" },
  { value: "grant", label: "Top-ups" },
];

interface CreditCategoryFilterProps {
  value: LedgerCategory;
  onChange: (value: LedgerCategory) => void;
}

export function CreditCategoryFilter({
  value,
  onChange,
}: CreditCategoryFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter by category"
      className="inline-flex flex-wrap p-1 rounded-2xl border border-white/10 bg-zinc-900/60"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
            value === opt.value
              ? "bg-violet-500/20 text-violet-100"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
