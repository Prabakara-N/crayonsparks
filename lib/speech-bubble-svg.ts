// SVG speech-bubble overlay generator. Takes normalized StoryBubble coords
// and the target page pixel size; returns an SVG string that gets
// composited onto the rendered page via sharp at export time.

import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { bubbleVisualPaths } from "@/lib/bubble-shapes";
import {
  BUBBLE_FONTS,
  DEFAULT_FONT_BY_SHAPE,
  type BubbleFont,
  type StoryBubble,
} from "@/lib/story-bubble-seed";

export interface RenderBubblesOptions {
  bubbles: StoryBubble[];
  pageWidth: number;
  pageHeight: number;
}

const STROKE_COLOR = "#1A1A1A";
const DEFAULT_FILL = "#FFFFFF";
const DEFAULT_TEXT = "#1A1A1A";
const STROKE_WIDTH = 2.4;
const DEFAULT_HEIGHT_FRACTION = 0.14;

function sanitizeHex(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
}

const FONT_FILES: Record<BubbleFont, string> = {
  "Patrick Hand": "PatrickHand-Regular.ttf",
  Kalam: "Kalam-Regular.ttf",
  Caveat: "Caveat-Regular.ttf",
  "Architects Daughter": "ArchitectsDaughter-Regular.ttf",
  Schoolbell: "Schoolbell-Regular.ttf",
  "Permanent Marker": "PermanentMarker-Regular.ttf",
};

const fontUriCache = new Map<BubbleFont, string>();
function fontDataUri(name: BubbleFont): string {
  const cached = fontUriCache.get(name);
  if (cached !== undefined) return cached;
  try {
    const fontPath = join(process.cwd(), "public", "fonts", FONT_FILES[name]);
    const buf = readFileSync(fontPath);
    const uri = `data:font/ttf;base64,${buf.toString("base64")}`;
    fontUriCache.set(name, uri);
    return uri;
  } catch {
    fontUriCache.set(name, "");
    return "";
  }
}

function fontFaceStyleFor(fonts: Set<BubbleFont>): string {
  const decls: string[] = [];
  for (const name of fonts) {
    const uri = fontDataUri(name);
    if (!uri) continue;
    decls.push(
      `@font-face{font-family:"${name}";src:url(${uri}) format("truetype");font-weight:400;font-style:normal;}`,
    );
  }
  if (decls.length === 0) return "";
  return `<style>${decls.join("")}</style>`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function approxCharWidth(fontSize: number): number {
  return fontSize * 0.58;
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return [];
  const charW = approxCharWidth(fontSize);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length * charW <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface RenderedBubble {
  svg: string;
  font: BubbleFont;
}

function renderBubble(
  bubble: StoryBubble,
  pageWidth: number,
  pageHeight: number,
): RenderedBubble {
  const shape = bubble.shape ?? "speech";
  const cx = bubble.x * pageWidth;
  const cy = bubble.y * pageHeight;
  const rx = (bubble.width * pageWidth) / 2;
  const heightFraction = bubble.height ?? DEFAULT_HEIGHT_FRACTION;
  const ry = (heightFraction * pageHeight) / 2;
  const tailTipX = bubble.tailTipX * pageWidth;
  const tailTipY = bubble.tailTipY * pageHeight;
  const visual = bubbleVisualPaths(shape, {
    cx,
    cy,
    rx,
    ry,
    tailTipX,
    tailTipY,
  });

  const autoFontSize = Math.max(14, Math.min(48, Math.min(rx, ry) * 0.36));
  const userFontSize =
    typeof bubble.fontSize === "number" && bubble.fontSize > 0
      ? Math.max(8, Math.min(72, bubble.fontSize)) *
        (Math.min(pageWidth, pageHeight) / 480)
      : null;
  const fontSize = userFontSize ?? autoFontSize;
  const lineHeight = fontSize * 1.2;
  const textPadX = rx * 0.18;
  const innerMaxWidth = Math.max(20, 2 * rx - 2 * textPadX);
  const lines = wrapText(bubble.text, innerMaxWidth, fontSize);
  const textTopY = cy - (lines.length - 1) * (lineHeight / 2);

  const font =
    (bubble.fontFamily as BubbleFont | undefined) ??
    DEFAULT_FONT_BY_SHAPE[shape];
  const fontFamilyAttr = `'${font}', 'Patrick Hand', 'Comic Sans MS', system-ui, sans-serif`;

  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="${cx.toFixed(2)}" dy="${i === 0 ? 0 : lineHeight.toFixed(2)}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const fill = sanitizeHex(bubble.fillColor, DEFAULT_FILL);
  const stroke = sanitizeHex(bubble.strokeColor, STROKE_COLOR);
  const textColor = sanitizeHex(bubble.textColor, DEFAULT_TEXT);
  const parts: string[] = [];
  parts.push(
    `<path d="${visual.bodyPath}" fill="${fill}" stroke="${stroke}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round" />`,
  );
  if (visual.tailFillPath) {
    parts.push(
      `<path d="${visual.tailFillPath}" fill="${fill}" stroke="none" />`,
    );
  }
  if (visual.tailStrokePath) {
    parts.push(
      `<path d="${visual.tailStrokePath}" fill="none" stroke="${stroke}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round" stroke-linecap="round" />`,
    );
  }
  for (const d of visual.tailDots) {
    parts.push(
      `<circle cx="${d.cx.toFixed(2)}" cy="${d.cy.toFixed(2)}" r="${d.r.toFixed(2)}" fill="${fill}" stroke="${stroke}" stroke-width="${STROKE_WIDTH}" />`,
    );
  }
  parts.push(
    `<text x="${cx.toFixed(2)}" y="${textTopY.toFixed(2)}" font-family="${fontFamilyAttr}" font-size="${fontSize}" font-weight="600" fill="${textColor}" text-anchor="middle" dominant-baseline="central">${tspans}</text>`,
  );

  return { svg: `<g>${parts.join("")}</g>`, font };
}

export function renderBubblesSvg(opts: RenderBubblesOptions): string | null {
  const bubbles = opts.bubbles.filter((b) => b.text.trim().length > 0);
  if (bubbles.length === 0) return null;
  const rendered = bubbles.map((b) =>
    renderBubble(b, opts.pageWidth, opts.pageHeight),
  );
  const usedFonts = new Set<BubbleFont>();
  for (const r of rendered) usedFonts.add(r.font);
  for (const fb of BUBBLE_FONTS) {
    if (!usedFonts.has(fb)) continue;
  }
  const fontStyle = fontFaceStyleFor(usedFonts);
  const inner = rendered.map((r) => r.svg).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.pageWidth}" height="${opts.pageHeight}" viewBox="0 0 ${opts.pageWidth} ${opts.pageHeight}">${fontStyle}${inner}</svg>`;
}
