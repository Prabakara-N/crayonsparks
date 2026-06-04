import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as opentype from "opentype.js";

type Font = opentype.Font;

// Trace glyphs are emitted as embedded vector PATHS (not SVG <text>) so the page
// rasterizes identically everywhere — no dependency on fontconfig finding the
// single-stroke font at render time (the cause of fallback "double dotted" glyphs).
const FONT_PATH = join(process.cwd(), "public/fonts/ReliefSingleLineCAD-Regular.ttf");
const LETTER_SPACING = 0.08;

let cached: Font | null = null;

function traceFont(): Font {
  if (cached) return cached;
  const buf = readFileSync(FONT_PATH);
  cached = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  return cached;
}

export function traceAdvanceWidth(text: string, fontSize: number): number {
  return traceFont().getAdvanceWidth(text, fontSize, { letterSpacing: LETTER_SPACING });
}

export function traceTextPathData(
  text: string,
  x: number,
  baselineY: number,
  fontSize: number,
): string {
  return traceFont()
    .getPath(text, x, baselineY, fontSize, { letterSpacing: LETTER_SPACING })
    .toPathData(2);
}
