import type { StoryBubble } from "@/lib/story-bubble-seed";

export interface BubbleStyleSnapshot {
  shape?: StoryBubble["shape"];
  fontFamily?: StoryBubble["fontFamily"];
  fontSize?: StoryBubble["fontSize"];
  fillColor?: StoryBubble["fillColor"];
  textColor?: StoryBubble["textColor"];
  strokeColor?: StoryBubble["strokeColor"];
}

export function extractBubbleStyle(bubble: StoryBubble): BubbleStyleSnapshot {
  return {
    shape: bubble.shape,
    fontFamily: bubble.fontFamily,
    fontSize: bubble.fontSize,
    fillColor: bubble.fillColor,
    textColor: bubble.textColor,
    strokeColor: bubble.strokeColor,
  };
}

export function applyBubbleStyle(
  bubble: StoryBubble,
  style: BubbleStyleSnapshot,
): StoryBubble {
  return {
    ...bubble,
    shape: style.shape ?? bubble.shape,
    fontFamily: style.fontFamily ?? bubble.fontFamily,
    fontSize: style.fontSize ?? bubble.fontSize,
    fillColor: style.fillColor ?? bubble.fillColor,
    textColor: style.textColor ?? bubble.textColor,
    strokeColor: style.strokeColor ?? bubble.strokeColor,
  };
}
