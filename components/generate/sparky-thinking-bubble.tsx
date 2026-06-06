"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { Mode } from "./guided-chat/types";

const GENERIC_MESSAGES = [
  "Sparky is thinking…",
  "Sparking up an idea…",
  "Drafting the next question…",
  "Reviewing your answer…",
  "Lining up the best options…",
];

const MESSAGES_BY_MODE: Record<Mode, string[]> = {
  qa: [
    "Sketching coloring-page ideas…",
    "Designing line-art subjects…",
    "Thinking up colorable scenes…",
    "Reviewing your answer…",
    "Tuning the brief for KDP…",
  ],
  story: [
    "Spinning up your story…",
    "Shaping characters and scenes…",
    "Drafting the next story beat…",
    "Calling on Sparky's classic-fable memory…",
    "Tuning the brief for KDP…",
  ],
  activity: [
    "Designing puzzles and mazes…",
    "Planning the activity pages…",
    "Mixing tracing, counting and games…",
    "Reviewing your answer…",
    "Tuning the brief for KDP…",
  ],
};

// Branded loading bubble shown while Sparky AI drafts its next reply.
export function SparkyThinkingBubble({ mode }: { mode?: Mode | null }) {
  const messages = mode ? MESSAGES_BY_MODE[mode] : GENERIC_MESSAGES;
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    setMessageIndex(0);
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(id);
  }, [messages]);

  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-linear-to-r from-violet-500/15 to-cyan-500/10 border border-violet-500/30 backdrop-blur shadow-md shadow-violet-500/10 min-w-[230px]">
        <span
          className="relative inline-flex w-7 h-7 rounded-full bg-linear-to-br from-violet-500 to-cyan-400 items-center justify-center shrink-0"
          aria-hidden
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="absolute inset-0 rounded-full ring-2 ring-violet-400/40 animate-ping opacity-60" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-violet-100 leading-tight transition-opacity">
            {messages[messageIndex]}
          </p>
          <p
            className="text-[11px] text-violet-300/80 mt-0.5 inline-flex items-center gap-1"
            aria-hidden
          >
            <span
              className="inline-block w-1 h-1 rounded-full bg-violet-300 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="inline-block w-1 h-1 rounded-full bg-violet-300 animate-bounce"
              style={{ animationDelay: "120ms" }}
            />
            <span
              className="inline-block w-1 h-1 rounded-full bg-violet-300 animate-bounce"
              style={{ animationDelay: "240ms" }}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
