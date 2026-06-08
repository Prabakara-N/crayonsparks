import type { GridAspect } from "@/components/playground/book-studio/back-cover-grid/back-cover-grid-types";
import type { AspectRatio } from "../types";

export interface CoverTrim {
  id: string;
  label: string;
  widthIn: number;
  heightIn: number;
  // CSS ratio string shared by the front compositor + back-cover editor.
  gridAspect: GridAspect;
  // Recommended single-image aspect for the front art at this trim.
  frontAspect: AspectRatio;
}

export const COVER_TRIMS: CoverTrim[] = [
  {
    id: "letter",
    label: '8.5 × 11" — Letter (coloring/activity)',
    widthIn: 8.5,
    heightIn: 11,
    gridAspect: "3 / 4",
    frontAspect: "3:4",
  },
  {
    id: "kdp69",
    label: '6 × 9" — KDP (story)',
    widthIn: 6,
    heightIn: 9,
    gridAspect: "2 / 3",
    frontAspect: "2:3",
  },
  {
    id: "a4",
    label: 'A4 — 8.27 × 11.69"',
    widthIn: 8.27,
    heightIn: 11.69,
    gridAspect: "8.27 / 11.69",
    frontAspect: "3:4",
  },
  {
    id: "square",
    label: '8.25 × 8.25" — Square',
    widthIn: 8.25,
    heightIn: 8.25,
    gridAspect: "1 / 1",
    frontAspect: "1:1",
  },
];

export const DEFAULT_COVER_TRIM = COVER_TRIMS[0];
