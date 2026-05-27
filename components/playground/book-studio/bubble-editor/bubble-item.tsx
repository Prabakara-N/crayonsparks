"use client";

import type { PointerEvent } from "react";
import { DEFAULT_FONT_BY_SHAPE } from "@/lib/story-bubble-seed";
import { BubbleResizeHandle } from "./bubble-resize-handle";
import { BubbleTextArea } from "./bubble-text-area";
import type { StoryBubble } from "../types";
import { DEFAULT_BUBBLE_HEIGHT, type DragMode } from "./bubble-editor-types";

interface BubbleItemProps {
  bubble: StoryBubble;
  selected: boolean;
  onSelect: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  onBeginDrag: (e: PointerEvent, id: string, mode: DragMode) => void;
}

export function BubbleItem({
  bubble,
  selected,
  onSelect,
  onTextChange,
  onBeginDrag,
}: BubbleItemProps) {
  const shape = bubble.shape ?? "speech";
  const font = bubble.fontFamily ?? DEFAULT_FONT_BY_SHAPE[shape];

  return (
    <div
      onPointerDown={(e) => {
        onSelect(bubble.id);
        onBeginDrag(e, bubble.id, "move");
      }}
      style={{
        left: `${bubble.x * 100}%`,
        top: `${bubble.y * 100}%`,
        width: `${bubble.width * 100}%`,
        height: `${(bubble.height ?? DEFAULT_BUBBLE_HEIGHT) * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
      className={`absolute pointer-events-auto cursor-move select-none touch-none ${
        selected
          ? "outline outline-2 outline-violet-500 outline-offset-4 rounded-[12%]"
          : ""
      }`}
    >
      <BubbleTextArea
        text={bubble.text}
        editable={selected}
        onChange={(text) => onTextChange(bubble.id, text)}
        fontFamily={font}
        color={bubble.textColor}
        fontSize={bubble.fontSize}
      />
      {selected && (
        <BubbleResizeHandle bubbleId={bubble.id} onBegin={onBeginDrag} />
      )}
    </div>
  );
}
