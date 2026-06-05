"use client";

import {
  ArrowLeft,
  MessageCircle,
  BookOpen,
  Puzzle,
  Sparkles,
  Eraser,
} from "lucide-react";
import type { Mode } from "./types";

interface ChatHeaderProps {
  mode: Mode | null;
  busy: boolean;
  showClear: boolean;
  onSwitchMode: () => void;
  onClearChat: () => void;
}

const MODE_BADGE: Record<Mode, { label: string; cls: string }> = {
  qa: {
    label: "Coloring book",
    cls: "bg-violet-500/15 border-violet-500/30 text-violet-200",
  },
  story: {
    label: "Story book",
    cls: "bg-cyan-500/15 border-cyan-500/30 text-cyan-200",
  },
  activity: {
    label: "Activity book",
    cls: "bg-emerald-500/15 border-emerald-500/30 text-emerald-200",
  },
};

function ModeIcon({ mode }: { mode: Mode }) {
  if (mode === "story") return <BookOpen className="w-3 h-3" />;
  if (mode === "activity") return <Puzzle className="w-3 h-3" />;
  return <MessageCircle className="w-3 h-3" />;
}

export function ChatHeader({
  mode,
  busy,
  showClear,
  onSwitchMode,
  onClearChat,
}: ChatHeaderProps) {
  return (
    <div className="px-6 md:px-8 pt-3 pb-3 flex items-center gap-2">
      {mode && (
        <button
          onClick={onSwitchMode}
          className="p-1.5 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
          title="Switch book type"
          aria-label="Switch book type"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
          mode
            ? MODE_BADGE[mode].cls
            : "bg-white/5 border-white/15 text-neutral-300"
        }`}
      >
        {mode ? <ModeIcon mode={mode} /> : <Sparkles className="w-3 h-3" />}
        {mode ? MODE_BADGE[mode].label : "Sparky AI"}
      </span>
      {showClear && (
        <button
          onClick={onClearChat}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-neutral-400 hover:bg-white/5 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Clear chat and start over"
          aria-label="Clear chat"
        >
          <Eraser className="w-3.5 h-3.5" />
          Clear chat
        </button>
      )}
    </div>
  );
}
