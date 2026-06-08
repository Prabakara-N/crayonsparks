import { PLAYFAIR_FAMILY } from "@/lib/fonts";
import type { PromptItem } from "../types";

export type GridAspect = "3 / 4" | "2 / 3" | "1 / 1" | "8.27 / 11.69";

export type GridSize = "2x2" | "3x2";

export interface SelectableImage {
  id: string;
  name: string;
  index: number;
  dataUrl: string;
}

// Normalized 0..1 against the back-cover canvas. x/y = block top-left,
// w = block width (fraction of canvas width), gap = gutter (fraction of width).
export interface GridLayout {
  x: number;
  y: number;
  w: number;
  gap: number;
}

export type FontKey = "elegant" | "clean" | "playful" | "script";

export interface FontOption {
  key: FontKey;
  label: string;
  cssStack: string;
  italic: boolean;
  weight: number;
}

export const TAGLINE_FONTS: FontOption[] = [
  {
    key: "elegant",
    label: "Elegant",
    cssStack: `${PLAYFAIR_FAMILY}, Georgia, "Times New Roman", serif`,
    italic: true,
    weight: 600,
  },
  {
    key: "clean",
    label: "Clean",
    cssStack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    italic: false,
    weight: 700,
  },
  {
    key: "playful",
    label: "Playful",
    cssStack: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive',
    italic: false,
    weight: 700,
  },
  {
    key: "script",
    label: "Script",
    cssStack: '"Brush Script MT", "Segoe Script", "Bradley Hand", cursive',
    italic: true,
    weight: 600,
  },
];

export function fontByKey(key: FontKey): FontOption {
  return TAGLINE_FONTS.find((f) => f.key === key) ?? TAGLINE_FONTS[0];
}

export interface TaglineDesign {
  show: boolean;
  text: string;
  x: number;
  y: number;
  fontScale: number;
  fontKey: FontKey;
  width: number;
  color: string;
}

export const TAGLINE_COLORS: string[] = [
  "#1f2937",
  "#ffffff",
  "#7c2d12",
  "#1e3a8a",
  "#0f766e",
  "#9d174d",
  "#b45309",
  "#4c1d95",
];

export interface StripeDesign {
  show: boolean;
  height: number;
  color: string;
}

export interface BackCoverDesign {
  bgColor: string;
  gridSize: GridSize;
  grid: GridLayout;
  tagline: TaglineDesign;
  topStripe: StripeDesign;
  imageIds: string[];
}

export const DEFAULT_GRID_LAYOUT: GridLayout = {
  x: 0.1,
  y: 0.36,
  w: 0.8,
  gap: 0.03,
};

export const DEFAULT_BG_COLOR = "#fbe9ef";
export const DEFAULT_STRIPE_COLOR = "#1f2937";

// Keep the default tagline to ~2 short lines — a book description can run long,
// which overflows the back-cover tagline box. Prefer the first sentence, then
// hard-cap on a word boundary.
function shortTagline(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= 80) return t;
  const firstSentence = t.split(/(?<=[.!?])\s/)[0] ?? t;
  if (firstSentence.length <= 90) return firstSentence.trim();
  const clipped = t.slice(0, 80);
  const lastSpace = clipped.lastIndexOf(" ");
  return (lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped).trim();
}

export function makeDefaultDesign(tagline: string): BackCoverDesign {
  return {
    bgColor: DEFAULT_BG_COLOR,
    gridSize: "2x2",
    grid: { ...DEFAULT_GRID_LAYOUT },
    tagline: {
      show: true,
      text: shortTagline(tagline),
      x: 0.5,
      y: 0.16,
      fontScale: 1,
      fontKey: "elegant",
      width: 0.72,
      color: "#1f2937",
    },
    topStripe: { show: false, height: 0.1, color: DEFAULT_STRIPE_COLOR },
    imageIds: [],
  };
}

const CELL_ASPECT = 3 / 4;

export function gridDims(size: GridSize): { cols: number; rows: number } {
  return size === "3x2" ? { cols: 3, rows: 2 } : { cols: 2, rows: 2 };
}

export function gridImageCount(size: GridSize): number {
  const { cols, rows } = gridDims(size);
  return cols * rows;
}

export interface CellRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function gridCellRects(
  layout: GridLayout,
  size: GridSize,
  canvasW: number,
  canvasH: number,
): CellRect[] {
  const { cols, rows } = gridDims(size);
  const left = layout.x * canvasW;
  const top = layout.y * canvasH;
  const gap = layout.gap * canvasW;
  const cellW = (layout.w * canvasW - gap * (cols - 1)) / cols;
  const cellH = cellW / CELL_ASPECT;
  const rects: CellRect[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      rects.push({
        x: left + col * (cellW + gap),
        y: top + row * (cellH + gap),
        w: cellW,
        h: cellH,
      });
    }
  }
  return rects;
}

export function gridBlockSize(
  layout: GridLayout,
  size: GridSize,
  canvasW: number,
): { w: number; h: number; gap: number; cellH: number; cols: number; rows: number } {
  const { cols, rows } = gridDims(size);
  const gap = layout.gap * canvasW;
  const cellW = (layout.w * canvasW - gap * (cols - 1)) / cols;
  const cellH = cellW / CELL_ASPECT;
  return {
    w: layout.w * canvasW,
    h: rows * cellH + (rows - 1) * gap,
    gap,
    cellH,
    cols,
    rows,
  };
}

export function toSelectableImages(items: PromptItem[]): SelectableImage[] {
  return items
    .map((it, index) => ({ it, index }))
    .filter(({ it }) => it.status === "done" && !!it.dataUrl)
    .map(({ it, index }) => ({
      id: it.id,
      name: it.name,
      index,
      dataUrl: it.dataUrl as string,
    }));
}
