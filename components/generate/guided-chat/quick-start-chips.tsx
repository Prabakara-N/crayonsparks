"use client";

interface QuickStartChipsProps {
  quickStarts: string[];
  onPick: (text: string) => void;
}

export function QuickStartChips({ quickStarts, onPick }: QuickStartChipsProps) {
  return (
    <div className="flex flex-col items-start gap-1.5 pt-1">
      <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold ml-1">
        Try one of these
      </span>
      <div className="flex flex-wrap gap-1.5">
        {quickStarts.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="text-left text-xs leading-snug px-3 py-1.5 rounded-2xl border border-white/10 bg-white/[0.03] text-neutral-200 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
