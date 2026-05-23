"use client";

export type RefKindFilter =
  | "all"
  | "signup"
  | "grant"
  | "purchase"
  | "spend"
  | "refund";

const OPTIONS: Array<{ value: RefKindFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "signup", label: "Signup" },
  { value: "grant", label: "Grants" },
  { value: "purchase", label: "Purchases" },
  { value: "spend", label: "Spends" },
  { value: "refund", label: "Refunds" },
];

interface RefKindFilterProps {
  value: RefKindFilter;
  onChange: (next: RefKindFilter) => void;
}

export function RefKindFilter({ value, onChange }: RefKindFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Credit ledger filter"
      className="inline-flex p-1 rounded-2xl border border-white/10 bg-zinc-900/60 overflow-x-auto"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
            value === opt.value
              ? "bg-amber-500/20 text-amber-100"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
