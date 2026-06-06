import "server-only";

// @ts-expect-error - hersheytext ships no type declarations
import ht from "hersheytext";

// Trace glyphs use the Hershey "futural" single-stroke vector font: each glyph is
// a true centreline polyline with CORRECT letterforms (unlike the Relief CAD font
// whose "2"/"3" rendered as broken X/8 shapes). We transform the strokes to
// absolute SVG path data and emit ONE dashed path = a clean single-dotted skeleton.
interface HGlyph {
  type: string;
  name: string;
  width: number;
  d: string | null;
}

const FONT = "futural";
const LETTER_SPACING = 5; // extra Hershey units between glyphs
const SPACE_WIDTH = 16; // advance for a space (renderTextArray returns null)

// Per-glyph shape fixes over the raw futural letterforms (kid-tracing tweaks):
// a — small tail at the stem end; i — round dot (was an angular diamond);
// O — widened so it reads round, not egg; z — bottom stroke lifted just off
// the baseline so it stays visible against the baseline guide.
const GLYPH_OVERRIDES: Record<string, { d: string; width?: number }> = {
  a: {
    d: "M15,8 L15,20 16,22 18,22 M15,11 L13,9 11,8 8,8 6,9 4,11 3,14 3,16 4,19 6,21 8,22 11,22 13,21 15,19",
  },
  i: {
    d: "M4,-0.3 L4.9,0.1 5.3,1 4.9,1.9 4,2.3 3.1,1.9 2.7,1 3.1,0.1 4,-0.3 M4,8 L4,22",
  },
  O: {
    width: 14,
    d: "M8.4,1 L5.8,2 3.2,4 1.9,6 0.6,9 0.6,14 1.9,17 3.2,19 5.8,21 8.4,22 13.6,22 16.2,21 18.8,19 20.1,17 21.4,14 21.4,9 20.1,6 18.8,4 16.2,2 13.6,1 8.4,1",
  },
  z: {
    d: "M14,8 L3,21 M3,8 L14,8 M3,21 L14,21",
  },
};

// renderTextArray yields one entry per char and `null` for spaces.
function rawGlyphs(text: string): (HGlyph | null)[] {
  return ht.renderTextArray(text, { font: FONT }) as (HGlyph | null)[];
}

function glyphs(text: string): (HGlyph | null)[] {
  const chars = [...text];
  return rawGlyphs(text).map((g, i) => {
    if (!g) return g;
    const ov = GLYPH_OVERRIDES[chars[i]];
    return ov ? { ...g, d: ov.d, width: ov.width ?? g.width } : g;
  });
}

export interface TraceMetrics {
  ascent: number;
  xHeight: number;
  descent: number;
}

interface FontGeometry extends TraceMetrics {
  baseline: number;
  em: number;
}

function glyphYRange(d: string): [number, number] {
  const ys = [...d.matchAll(/-?[\d.]+,(-?[\d.]+)/g)].map((m) => parseFloat(m[1]));
  return ys.length ? [Math.min(...ys), Math.max(...ys)] : [Infinity, -Infinity];
}

let geometryCache: FontGeometry | null = null;

function geometry(): FontGeometry {
  if (geometryCache) return geometryCache;
  const range = (s: string): [number, number] => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const g of rawGlyphs(s)) {
      if (!g?.d) continue;
      const [a, b] = glyphYRange(g.d);
      lo = Math.min(lo, a);
      hi = Math.max(hi, b);
    }
    return [lo, hi];
  };
  const caps = range("ABDHKL1234567890");
  const xs = range("aceomnrsuvwxz");
  const desc = range("gjpqy");
  const baseline = caps[1];
  const ascentU = baseline - caps[0];
  const xHeightU = baseline - xs[0];
  const descentU = Math.max(0, desc[1] - baseline);
  const em = ascentU + descentU;
  geometryCache = {
    baseline,
    em,
    ascent: ascentU / em,
    xHeight: xHeightU / em,
    descent: descentU / em,
  };
  return geometryCache;
}

export function traceMetrics(): TraceMetrics {
  const g = geometry();
  return { ascent: g.ascent, xHeight: g.xHeight, descent: g.descent };
}

export function traceAdvanceWidth(text: string, fontSize: number): number {
  const scale = fontSize / geometry().em;
  let units = 0;
  for (const g of glyphs(text)) units += (g?.width ?? SPACE_WIDTH) + LETTER_SPACING;
  return units * scale;
}

// Transforms one Hershey glyph's "M x,y L x,y ..." polyline into absolute SVG
// path data, placing its baseline at baselineY and its left edge at originX.
function placeGlyph(
  d: string,
  originX: number,
  baselineY: number,
  scale: number,
  hBaseline: number,
): string {
  const out: string[] = [];
  for (const tok of d.trim().split(/\s+/)) {
    let cmd = "L";
    let body = tok;
    if (body[0] === "M") {
      cmd = "M";
      body = body.slice(1);
    } else if (body[0] === "L") {
      body = body.slice(1);
    }
    if (!body) continue;
    const [pxs, pys] = body.split(",");
    const px = parseFloat(pxs);
    const py = parseFloat(pys);
    if (Number.isNaN(px) || Number.isNaN(py)) continue;
    const sx = (originX + px * scale).toFixed(2);
    const sy = (baselineY + (py - hBaseline) * scale).toFixed(2);
    out.push(`${cmd}${sx},${sy}`);
  }
  return out.join(" ");
}

export function traceTextPathData(
  text: string,
  x: number,
  baselineY: number,
  fontSize: number,
): string {
  const geo = geometry();
  const scale = fontSize / geo.em;
  const parts: string[] = [];
  let cursor = 0;
  for (const g of glyphs(text)) {
    if (g?.d) {
      parts.push(placeGlyph(g.d, x + cursor * scale, baselineY, scale, geo.baseline));
    }
    cursor += (g?.width ?? SPACE_WIDTH) + LETTER_SPACING;
  }
  return parts.join(" ");
}
