import type { ActivityResult, ActivitySpec } from "./types";
import { escapeXml, PAGE, SANS, svgDocument, titleBlock } from "./page";
import {
  traceAdvanceWidth,
  traceTextPathData,
  traceTextDots,
  traceMetrics,
} from "./trace-font";

export interface TracingOptions {
  headerLine: string;
  traceLine: string;
  instruction: string;
  repeatTrace: boolean;
  rows: number;
  referenceWord?: string;
}

const TRACE_STROKE = "#9aa0a6";

interface RowGeometry {
  top: number;
  mid: number;
  base: number;
  fontSize: number;
}

// Derive the glyph size + three ruled lines from the font's real ink metrics:
// caps/ascenders reach the top line, everything rests on the baseline with
// Equal 3-line spacing with the dashed midline at the EXACT centre. Lowercase
// x-height is sized to the bottom half, so small letters sit between the middle
// line and the baseline (never above the middle line); capitals and ascenders
// reach up toward the top line, descenders drop below the baseline.
function rowGeometry(y: number, rowH: number): RowGeometry {
  const { xHeight, descent } = traceMetrics();
  const fontSize = (rowH * 0.82) / (2 * xHeight + descent);
  const half = xHeight * fontSize;
  const descPx = descent * fontSize;
  const topPad = (rowH - (2 * half + descPx)) / 2;
  const top = y + topPad;
  const base = top + 2 * half;
  return { top, mid: top + half, base, fontSize };
}

function ruledRow(y: number, rowH: number): string {
  const { top, mid, base } = rowGeometry(y, rowH);
  const x1 = PAGE.margin;
  const x2 = PAGE.w - PAGE.margin;
  return (
    `<line x1="${x1}" y1="${top}" x2="${x2}" y2="${top}" stroke="#4b5563" stroke-width="2"/>` +
    `<line x1="${x1}" y1="${mid}" x2="${x2}" y2="${mid}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="8 8"/>` +
    `<line x1="${x1}" y1="${base}" x2="${x2}" y2="${base}" stroke="#4b5563" stroke-width="2"/>`
  );
}

// Row 1 of a trace page: single-dotted skeleton glyphs to trace over. Each pen
// stroke is one dotted line (single-stroke font) — no solid model, no double
// outline.
function traceGlyphs(y: number, rowH: number, text: string, repeat: boolean): string {
  const { base, fontSize } = rowGeometry(y, rowH);
  const x = PAGE.margin + 16;
  let content = text;
  if (repeat) {
    const unit = `${text} `;
    const unitWidth = traceAdvanceWidth(unit, fontSize);
    const available = PAGE.w - 2 * PAGE.margin - 16;
    content = unit.repeat(Math.max(2, Math.floor(available / unitWidth)));
  }
  const d = traceTextPathData(content, x, base, fontSize);
  const dots = traceTextDots(content, x, base, fontSize)
    .map(
      (dt) =>
        `<circle cx="${dt.cx.toFixed(2)}" cy="${dt.cy.toFixed(2)}" r="${dt.r.toFixed(2)}" fill="${TRACE_STROKE}"/>`,
    )
    .join("");
  return `<path d="${d}" fill="none" stroke="${TRACE_STROKE}" stroke-width="2.5" stroke-dasharray="2 6" stroke-linecap="round"/>${dots}`;
}

function referenceBlock(opts: TracingOptions, assetDataUrl: string): string {
  const letter = opts.headerLine.trim()[0] ?? "";
  const word = (opts.referenceWord ?? "").trim();
  const cap = word.replace(/\b\w/g, (m) => m.toUpperCase());
  const boxSize = 190;
  const x = PAGE.w - PAGE.margin - boxSize;
  const y = PAGE.bodyTop;
  const img = `<image href="${assetDataUrl}" x="${x}" y="${y}" width="${boxSize}" height="${boxSize}" preserveAspectRatio="xMidYMid meet"/>`;
  const caption = `<text x="${PAGE.w / 2}" y="${PAGE.bodyTop + 250}" text-anchor="middle" font-family="${SANS}" font-size="32" font-weight="700" fill="#111">${escapeXml(`${letter} is for ${cap}`)}</text>`;
  return img + caption;
}

export function buildTracingPage(
  spec: ActivitySpec,
  opts: TracingOptions,
  assetDataUrl?: string,
): ActivityResult {
  const hasRef = !!assetDataUrl && !!opts.referenceWord;
  const headerSize = 90;
  const header = hasRef
    ? `<text x="${PAGE.margin + 110}" y="${PAGE.bodyTop + 70}" text-anchor="middle" font-family="${SANS}" font-size="${headerSize}" font-weight="700" fill="#111">${escapeXml(opts.headerLine)}</text>`
    : `<text x="${PAGE.w / 2}" y="${PAGE.bodyTop + 40}" text-anchor="middle" font-family="${SANS}" font-size="${headerSize}" font-weight="700" fill="#111">${escapeXml(opts.headerLine)}</text>`;

  const refBlock = hasRef ? referenceBlock(opts, assetDataUrl as string) : "";
  const rowsTop = PAGE.bodyTop + (hasRef ? 280 : 110);
  const available = PAGE.h - PAGE.margin - rowsTop;
  const rowH = available / opts.rows;
  const rowSvgs: string[] = [];
  for (let i = 0; i < opts.rows; i++) {
    const y = rowsTop + i * rowH;
    const guides = ruledRow(y, rowH);
    const glyphs = i < 1 ? traceGlyphs(y, rowH, opts.traceLine, opts.repeatTrace) : "";
    rowSvgs.push(guides + glyphs);
  }

  const body = titleBlock(spec.title, opts.instruction) + header + refBlock + rowSvgs.join("");
  return { svg: svgDocument(body), meta: { trace: opts.traceLine } };
}
