"use client";

import type { PointerEvent } from "react";
import type { StoryBubble } from "../types";

interface BubbleTailHandleProps {
  bubble: StoryBubble;
  onBegin: (e: PointerEvent, id: string, mode: "tail") => void;
}

export function BubbleTailHandle({ bubble, onBegin }: BubbleTailHandleProps) {
  return (
    <button
      type="button"
      aria-label="Move tail tip"
      onPointerDown={(e) => onBegin(e, bubble.id, "tail")}
      style={{
        left: `${bubble.tailTipX * 100}%`,
        top: `${bubble.tailTipY * 100}%`,
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cyan-400 border-2 border-white shadow-md cursor-grab active:cursor-grabbing touch-none pointer-events-auto"
    />
  );
}
