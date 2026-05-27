// Seeds initial speech-bubble positions for a story page. The image model
// generates the page WITHOUT bubbles; the studio's editor renders them as
// draggable overlays and the user can reposition before export.

import type { StoryDialogueLine } from "@/lib/prompts";

export type AgeBand = "toddlers" | "kids" | "tweens";

export type BubbleShape = "speech" | "comic" | "thought" | "narration";

export const BUBBLE_FONTS = [
  "Patrick Hand",
  "Kalam",
  "Caveat",
  "Architects Daughter",
  "Schoolbell",
  "Permanent Marker",
] as const;
export type BubbleFont = (typeof BUBBLE_FONTS)[number];

export const BUBBLE_FILL_COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Cream", value: "#FFF8E7" },
  { name: "Sun", value: "#FFF1B8" },
  { name: "Peach", value: "#FFE0CC" },
  { name: "Blush", value: "#FFDCE7" },
  { name: "Lilac", value: "#E8D9F5" },
  { name: "Sky", value: "#DDECFB" },
  { name: "Mint", value: "#DDF3E0" },
] as const;

export const BUBBLE_TEXT_COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Ink", value: "#1A1A1A" },
  { name: "Charcoal", value: "#3A3A3A" },
  { name: "Gray", value: "#6B6B6B" },
  { name: "Navy", value: "#1F3A5F" },
  { name: "Forest", value: "#2A5F2A" },
  { name: "Plum", value: "#4A1F5F" },
  { name: "Brick", value: "#7A2222" },
] as const;

export const BUBBLE_STROKE_COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Ink", value: "#1A1A1A" },
  { name: "Charcoal", value: "#3A3A3A" },
  { name: "Gray", value: "#6B6B6B" },
  { name: "Navy", value: "#1F3A5F" },
  { name: "Forest", value: "#2A5F2A" },
  { name: "Plum", value: "#4A1F5F" },
  { name: "Brick", value: "#7A2222" },
] as const;

export const DEFAULT_FILL_COLOR = BUBBLE_FILL_COLORS[0].value;
export const DEFAULT_TEXT_COLOR = BUBBLE_TEXT_COLORS[1].value;
export const DEFAULT_STROKE_COLOR = BUBBLE_STROKE_COLORS[1].value;

export const MIN_FONT_SIZE = 10;
export const MAX_FONT_SIZE = 36;
export const DEFAULT_FONT_SIZE = 16;

export const DEFAULT_FONT_BY_SHAPE: Record<BubbleShape, BubbleFont> = {
  speech: "Patrick Hand",
  comic: "Patrick Hand",
  thought: "Caveat",
  narration: "Kalam",
};

export interface StoryBubble {
  id: string;
  text: string;
  speaker?: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  tailTipX: number;
  tailTipY: number;
  shape?: BubbleShape;
  fontSize?: number;
  strokeColor?: string;
  fontFamily?: BubbleFont;
  fillColor?: string;
  textColor?: string;
}

const BUBBLE_WIDTH = 0.42;
const BUBBLE_HEIGHT = 0.14;
const SIDE_PADDING = 0.06;
const TOP_MARGIN = 0.09;
const VERTICAL_STRIDE = 0.18;
const TAIL_DROP = 0.32;
const TAIL_HORIZONTAL_BIAS = 0.55;

function makeId(seed: number): string {
  return `b_${seed.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function seedBubble(
  line: StoryDialogueLine,
  index: number,
): StoryBubble {
  const side = line.speakerSide ?? "left";
  const halfWidth = BUBBLE_WIDTH / 2;
  const x =
    side === "left"
      ? SIDE_PADDING + halfWidth
      : side === "right"
        ? 1 - SIDE_PADDING - halfWidth
        : 0.5;
  const y = TOP_MARGIN + index * VERTICAL_STRIDE;
  const tailTipY = y + TAIL_DROP;
  const tailOffset = halfWidth * TAIL_HORIZONTAL_BIAS;
  const tailTipX =
    side === "left" ? x - tailOffset : side === "right" ? x + tailOffset : x;
  return {
    id: makeId(index),
    text: line.text.trim(),
    speaker: line.speaker?.trim() || undefined,
    x,
    y,
    width: BUBBLE_WIDTH,
    height: BUBBLE_HEIGHT,
    tailTipX,
    tailTipY,
  };
}

export function seedBubblesFromDialogue(
  dialogue: StoryDialogueLine[] | undefined,
): StoryBubble[] {
  if (!dialogue || dialogue.length === 0) return [];
  return dialogue
    .filter((d) => d.text.trim().length > 0)
    .map((d, i) => seedBubble(d, i));
}
