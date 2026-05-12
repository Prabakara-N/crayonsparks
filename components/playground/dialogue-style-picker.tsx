"use client";

import { cn } from "@/lib/utils";
import {
  DIALOGUE_STYLE_LABEL,
  type DialogueStyle,
} from "@/lib/prompts";

interface DialogueStylePickerProps {
  value: DialogueStyle;
  onChange: (value: DialogueStyle) => void;
  disabled?: boolean;
}

const OPTIONS: ReadonlyArray<{
  value: DialogueStyle;
  emoji: string;
  hint: string;
}> = [
  {
    value: "quiet",
    emoji: "🌙",
    hint: "Narration-driven, Goodnight Moon energy",
  },
  {
    value: "balanced",
    emoji: "📖",
    hint: "Captions + dialogue, Beatrix Potter energy",
  },
  {
    value: "chatty",
    emoji: "💬",
    hint: "Lots of speech bubbles, Pigeon books energy",
  },
];

export function DialogueStylePicker({
  value,
  onChange,
  disabled,
}: DialogueStylePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Dialogue style"
      className="grid grid-cols-1 sm:grid-cols-3 gap-2"
    >
      {OPTIONS.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={cn(
              "flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
              selected
                ? "border-cyan-500/60 bg-cyan-500/10 text-white"
                : "border-white/10 bg-black/40 text-neutral-300 hover:border-cyan-500/30 hover:bg-white/5",
            )}
          >
            <span className="text-base shrink-0 mt-0.5" aria-hidden>
              {opt.emoji}
            </span>
            <span className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold">
                {DIALOGUE_STYLE_LABEL[opt.value]}
              </span>
              <span className="text-[11px] text-neutral-400 leading-snug">
                {opt.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
