"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { StoryBubble } from "../types";
import {
  COORD_PADDING,
  DEFAULT_BUBBLE_HEIGHT,
  MAX_BUBBLE_HEIGHT,
  MAX_BUBBLE_WIDTH,
  MIN_BUBBLE_HEIGHT,
  MIN_BUBBLE_WIDTH,
  type DragMode,
  type DragState,
} from "./bubble-editor-types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface UseBubbleDragArgs {
  containerRef: RefObject<HTMLDivElement | null>;
  bubbles: StoryBubble[];
  onChange: (next: StoryBubble[]) => void;
}

export interface UseBubbleDragResult {
  draggingId: string | null;
  beginDrag: (
    event: React.PointerEvent,
    bubbleId: string,
    mode: DragMode,
  ) => void;
}

export function useBubbleDrag({
  containerRef,
  bubbles,
  onChange,
}: UseBubbleDragArgs): UseBubbleDragResult {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const stateRef = useRef<DragState | null>(null);
  const latestRef = useRef<StoryBubble[]>(bubbles);
  const onChangeRef = useRef(onChange);
  latestRef.current = bubbles;
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!draggingId) return;
    const onMove = (e: PointerEvent) => {
      const drag = stateRef.current;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!drag || !rect || rect.width === 0 || rect.height === 0) return;
      const dx = (e.clientX - drag.startPointerX) / rect.width;
      const dy = (e.clientY - drag.startPointerY) / rect.height;
      const start = drag.startBubble;
      const next = latestRef.current.map((b) => {
        if (b.id !== drag.bubbleId) return b;
        if (drag.mode === "move") {
          return {
            ...b,
            x: clamp(start.x + dx, COORD_PADDING, 1 - COORD_PADDING),
            y: clamp(start.y + dy, COORD_PADDING, 1 - COORD_PADDING),
          };
        }
        if (drag.mode === "resize") {
          const startHeight = start.height ?? DEFAULT_BUBBLE_HEIGHT;
          return {
            ...b,
            width: clamp(
              start.width + dx * 2,
              MIN_BUBBLE_WIDTH,
              MAX_BUBBLE_WIDTH,
            ),
            height: clamp(
              startHeight + dy * 2,
              MIN_BUBBLE_HEIGHT,
              MAX_BUBBLE_HEIGHT,
            ),
          };
        }
        return {
          ...b,
          tailTipX: clamp(start.tailTipX + dx, 0, 1),
          tailTipY: clamp(start.tailTipY + dy, 0, 1),
        };
      });
      onChangeRef.current(next);
    };
    const onUp = () => {
      stateRef.current = null;
      setDraggingId(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [draggingId, containerRef]);

  const beginDrag = useCallback(
    (event: React.PointerEvent, bubbleId: string, mode: DragMode) => {
      const start = latestRef.current.find((b) => b.id === bubbleId);
      if (!start) return;
      event.preventDefault();
      event.stopPropagation();
      stateRef.current = {
        bubbleId,
        mode,
        startPointerX: event.clientX,
        startPointerY: event.clientY,
        startBubble: start,
      };
      setDraggingId(bubbleId);
    },
    [],
  );

  return { draggingId, beginDrag };
}
