import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as opentype from "opentype.js";

type Font = opentype.Font;

// Trace glyphs are emitted as embedded vector PATHS (not SVG <text>) so the page
// rasterizes identically everywhere — no dependency on fontconfig finding the
// font at render time. Relief SingleLine CAD is a SINGLE-STROKE font: each glyph
// is a centreline path, so a dashed stroke draws ONE dotted line per pen stroke
// (a true single-dotted skeleton to trace), not a double hollow outline.
const FONT_PATH = join(process.cwd(), "public/fonts/ReliefSingleLineCAD-Regular.ttf");
const LETTER_SPACING = 0.08;

let cached: Font | null = null;

function traceFont(): Font {
  if (cached) return cached;
  const buf = readFileSync(FONT_PATH);
  cached = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  return cached;
}

export interface TraceMetrics {
  ascent: number;
  xHeight: number;
  descent: number;
}

let metricsCache: TraceMetrics | null = null;

// Ink-based metrics (fractions of em above/below the baseline) measured from the
// actual glyph bounds so the ruled lines hug the real letters: top = where caps
// and ascenders reach, mid = x-height, base = baseline, plus descender room.
export function traceMetrics(): TraceMetrics {
  if (metricsCache) return metricsCache;
  const font = traceFont();
  const em = font.unitsPerEm;
  const probe = (chars: string): { top: number; bot: number } => {
    let top = 0;
    let bot = 0;
    for (const ch of chars) {
      const bb = font.getPath(ch, 0, 0, em).getBoundingBox();
      top = Math.min(top, bb.y1);
      bot = Math.max(bot, bb.y2);
    }
    return { top, bot };
  };
  const asc = probe("ABDHKLbdhklt1234567890");
  const xh = probe("acemnorsuvwxz");
  const desc = probe("gjpqy");
  metricsCache = {
    ascent: -asc.top / em,
    xHeight: -xh.top / em,
    descent: desc.bot / em,
  };
  return metricsCache;
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
