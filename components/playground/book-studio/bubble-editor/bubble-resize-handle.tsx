"use client";

import type { PointerEvent } from "react";

interface BubbleResizeHandleProps {
  bubbleId: string;
  onBegin: (e: PointerEvent, id: string, mode: "resize") => void;
}

export function BubbleResizeHandle({
  bubbleId,
  onBegin,
}: BubbleResizeHandleProps) {
  return (
    <button
      type="button"
      aria-label="Resize bubble"
      onPointerDown={(e) => onBegin(e, bubbleId, "resize")}
      className="absolute -right-2 -bottom-2 w-5 h-5 rounded-full bg-violet-500 border-2 border-white shadow-md cursor-nwse-resize touch-none"
    />
  );
}
