"use client";

import { Palette, BookOpen, Wand2, FileText, MessagesSquare } from "lucide-react";

interface ActionRow {
  icon: React.ReactNode;
  label: string;
  creditValue: string;
  hint?: string;
}

const ACTION_ROWS: ReadonlyArray<ActionRow> = [
  {
    icon: <Palette className="w-4 h-4" />,
    label: "Coloring page",
    creditValue: "3 credits",
    hint: "9 credits on Pro models",
  },
  {
    icon: <BookOpen className="w-4 h-4" />,
    label: "Story page (full color)",
    creditValue: "4 credits",
    hint: "11 credits on Pro models",
  },
  {
    icon: <Wand2 className="w-4 h-4" />,
    label: "Refine an existing page",
    creditValue: "3 credits",
    hint: "small tweak via Sparky chat",
  },
  {
    icon: <FileText className="w-4 h-4" />,
    label: "PDF export + downloads",
    creditValue: "Free",
    hint: "all formats included",
  },
  {
    icon: <MessagesSquare className="w-4 h-4" />,
    label: "Sparky AI planning chat",
    creditValue: "Free",
    hint: "plan as much as you want",
  },
];

export function CreditExplainer() {
  return (
    <div className="rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl p-6 md:p-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            What does each credit buy?
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed mb-5">
            Credits map directly to actions — no surprise costs, no hidden
            page-count caps. The button you click always shows what it will
            spend before you commit.
          </p>
          <div className="space-y-3.5">
            <BookCostRow
              label="A typical 24-page coloring book"
              cost="~90 credits"
              hint="cover + back + nameplate + 24 pages + a couple of refines"
            />
            <BookCostRow
              label="A 24-page story book (Pro models)"
              cost="~295 credits"
              hint="Pro-quality painterly art on every page"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-black/40 border border-white/10 divide-y divide-white/5 overflow-hidden">
          {ACTION_ROWS.map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-300 flex items-center justify-center shrink-0">
                {row.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">
                  {row.label}
                </div>
                {row.hint && (
                  <div className="text-[11px] text-neutral-500 leading-tight mt-0.5">
                    {row.hint}
                  </div>
                )}
              </div>
              <div
                className={
                  row.creditValue === "Free"
                    ? "text-sm font-bold text-emerald-400 shrink-0"
                    : "text-sm font-bold text-violet-300 shrink-0"
                }
              >
                {row.creditValue}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BookCostRow({
  label,
  cost,
  hint,
}: {
  label: string;
  cost: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-1 h-12 rounded-full bg-linear-to-b from-violet-400 to-cyan-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="text-sm font-bold text-violet-300">{cost}</span>
        </div>
        <div className="text-xs text-neutral-500 mt-0.5">{hint}</div>
      </div>
    </div>
  );
}
