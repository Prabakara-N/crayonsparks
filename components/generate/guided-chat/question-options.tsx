"use client";

interface QuestionOptionsProps {
  options: string[];
  optionDescriptions?: string[];
  onPick: (option: string) => void;
}

export function QuestionOptions({
  options,
  optionDescriptions,
  onPick,
}: QuestionOptionsProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {options.map((opt, idx) => {
        const desc = optionDescriptions?.[idx];
        return (
          <button
            key={opt}
            onClick={() => onPick(opt)}
            title={desc}
            className="group/chip relative px-3 py-1.5 rounded-full text-xs font-medium bg-violet-500/10 border border-violet-500/30 text-violet-200 hover:bg-violet-500/20"
          >
            {opt}
            {desc && (
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-0 mb-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-white/15 text-[11px] font-normal text-neutral-100 leading-snug whitespace-normal w-max max-w-[18rem] opacity-0 invisible group-hover/chip:opacity-100 group-hover/chip:visible transition-opacity shadow-lg shadow-black/40 z-20"
              >
                {desc}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
