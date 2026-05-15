"use client";

import { ArrowLeft, MessageCircle, BookOpen, Eraser } from "lucide-react";
import type { Mode } from "./types";

interface ChatHeaderProps {
  mode: Mode;
  busy: boolean;
  showClear: boolean;
  onSwitchMode: () => void;
  onClearChat: () => void;
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
      <button
        onClick={onSwitchMode}
        className="p-1.5 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
        title="Switch chat mode"
        aria-label="Switch chat mode"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
          mode === "story"
            ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-200"
            : "bg-violet-500/15 border-violet-500/30 text-violet-200"
        }`}
      >
        {mode === "story" ? (
          <BookOpen className="w-3 h-3" />
        ) : (
          <MessageCircle className="w-3 h-3" />
        )}
        {mode === "story" ? "Story book" : "Coloring book"}
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
