import type { StoryBubble } from "../types";

export type DragMode = "move" | "resize" | "tail";

export interface DragState {
  bubbleId: string;
  mode: DragMode;
  startPointerX: number;
  startPointerY: number;
  startBubble: StoryBubble;
}

export interface BubbleEditorProps {
  bubbles: StoryBubble[];
  onChange: (next: StoryBubble[]) => void;
  aspectRatio?: string;
  imageSrc?: string;
  className?: string;
  showAddButton?: boolean;
}

export const MIN_BUBBLE_WIDTH = 0.12;
export const MAX_BUBBLE_WIDTH = 0.85;
export const MIN_BUBBLE_HEIGHT = 0.04;
export const MAX_BUBBLE_HEIGHT = 0.55;
export const DEFAULT_BUBBLE_HEIGHT = 0.14;
export const COORD_PADDING = 0.02;
