"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  applyBubbleStyle,
  extractBubbleStyle,
  type BubbleStyleSnapshot,
} from "@/lib/bubble-style";
import type { StoryBubble } from "../types";
import { DEFAULT_BUBBLE_HEIGHT } from "./bubble-editor-types";

function makeId(): string {
  return `b_${Math.random().toString(36).slice(2, 9)}`;
}

function defaultBubble(): StoryBubble {
  return {
    id: makeId(),
    text: "New bubble",
    x: 0.5,
    y: 0.2,
    width: 0.4,
    height: DEFAULT_BUBBLE_HEIGHT,
    tailTipX: 0.5,
    tailTipY: 0.55,
    shape: "speech",
  };
}

interface UseBubbleEditorActionsArgs {
  bubbles: StoryBubble[];
  onChange: (next: StoryBubble[]) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onApplyStyleToBook?: (style: BubbleStyleSnapshot) => void;
}

export interface BubbleEditorActions {
  updateText: (id: string, text: string) => void;
  deleteBubble: (id: string) => void;
  addBubble: () => void;
  changeShape: (id: string, shape: StoryBubble["shape"]) => void;
  changeFont: (id: string, fontFamily: StoryBubble["fontFamily"]) => void;
  changeFill: (id: string, fillColor: string) => void;
  changeText: (id: string, textColor: string) => void;
  changeStroke: (id: string, strokeColor: string) => void;
  changeFontSize: (id: string, fontSize: number) => void;
  applyStyleToAll: (id: string) => void;
}

export function useBubbleEditorActions({
  bubbles,
  onChange,
  selectedId,
  setSelectedId,
  onApplyStyleToBook,
}: UseBubbleEditorActionsArgs): BubbleEditorActions {
  const updateText = useCallback(
    (id: string, text: string) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, text } : b)));
    },
    [bubbles, onChange],
  );

  const deleteBubble = useCallback(
    (id: string) => {
      onChange(bubbles.filter((b) => b.id !== id));
      if (selectedId === id) setSelectedId(null);
    },
    [bubbles, onChange, selectedId, setSelectedId],
  );

  const addBubble = useCallback(() => {
    const next = defaultBubble();
    onChange([...bubbles, next]);
    setSelectedId(next.id);
  }, [bubbles, onChange, setSelectedId]);

  const changeShape = useCallback(
    (id: string, shape: StoryBubble["shape"]) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, shape } : b)));
    },
    [bubbles, onChange],
  );

  const changeFont = useCallback(
    (id: string, fontFamily: StoryBubble["fontFamily"]) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, fontFamily } : b)));
    },
    [bubbles, onChange],
  );

  const changeFill = useCallback(
    (id: string, fillColor: string) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, fillColor } : b)));
    },
    [bubbles, onChange],
  );

  const changeText = useCallback(
    (id: string, textColor: string) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, textColor } : b)));
    },
    [bubbles, onChange],
  );

  const changeStroke = useCallback(
    (id: string, strokeColor: string) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, strokeColor } : b)));
    },
    [bubbles, onChange],
  );

  const changeFontSize = useCallback(
    (id: string, fontSize: number) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, fontSize } : b)));
    },
    [bubbles, onChange],
  );

  const applyStyleToAll = useCallback(
    (id: string) => {
      const source = bubbles.find((b) => b.id === id);
      if (!source) return;
      const style = extractBubbleStyle(source);
      const others = bubbles.length - 1;
      onChange(bubbles.map((b) => applyBubbleStyle(b, style)));
      if (onApplyStyleToBook) {
        onApplyStyleToBook(style);
      } else if (others > 0) {
        toast.success(
          `Style applied to ${others} other bubble${others === 1 ? "" : "s"} on this page.`,
        );
      }
    },
    [bubbles, onChange, onApplyStyleToBook],
  );

  return {
    updateText,
    deleteBubble,
    addBubble,
    changeShape,
    changeFont,
    changeFill,
    changeText,
    changeStroke,
    changeFontSize,
    applyStyleToAll,
  };
}

export { defaultBubble };
