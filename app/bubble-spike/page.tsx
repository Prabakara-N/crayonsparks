"use client";

import { useState } from "react";
import { BubbleEditor } from "@/components/playground/book-studio/bubble-editor/bubble-editor-main";
import type { StoryBubble } from "@/components/playground/book-studio/types";

const SEED: StoryBubble[] = [
  {
    id: "seed-1",
    text: "Happy birthday!",
    x: 0.28,
    y: 0.14,
    width: 0.36,
    tailTipX: 0.22,
    tailTipY: 0.42,
  },
  {
    id: "seed-2",
    text: "Thank you!",
    x: 0.72,
    y: 0.14,
    width: 0.32,
    tailTipX: 0.78,
    tailTipY: 0.42,
  },
];

export default function BubbleSpikePage() {
  const [bubbles, setBubbles] = useState<StoryBubble[]>(SEED);

  return (
    <div className="min-h-dvh bg-zinc-950 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Speech-bubble editor — UX spike</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Throwaway sandbox. Click a bubble to select. Drag the body to move,
            grab the violet handle to resize, drag the cyan dot to redirect the
            tail. Double-click text to edit. Add or delete from the toolbars.
          </p>
        </header>

        <div className="flex flex-col items-center gap-4">
          <BubbleEditor bubbles={bubbles} onChange={setBubbles} />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBubbles(SEED)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold"
            >
              Reset seed
            </button>
            <button
              type="button"
              onClick={() => setBubbles([])}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
