import type { ActivityResult, ActivitySpec } from "./types";
import { escapeXml, PAGE, SANS, svgDocument, titleBlock } from "./page";

export interface TracingOptions {
  headerLine: string;
  traceLine: string;
  instruction: string;
  repeatTrace: boolean;
  rows: number;
}

// Dotted outline for trace glyphs — the child traces/joins the dots to form
// the letter, rather than coloring a solid grey shape.
const TRACE_STROKE = "#b8b8b8";
const traceGlyphAttrs = (fontSize: number): string =>
  `font-family="${SANS}" font-size="${fontSize}" fill="none" stroke="${TRACE_STROKE}" stroke-width="2.5" stroke-dasharray="2 8" stroke-linecap="round" letter-spacing="6"`;

function ruledRow(y: number, rowH: number): string {
  const top = y;
  const mid = y + rowH * 0.45;
  const base = y + rowH * 0.85;
  const x1 = PAGE.margin;
  const x2 = PAGE.w - PAGE.margin;
  return (
    `<line x1="${x1}" y1="${top}" x2="${x2}" y2="${top}" stroke="#9ca3af" stroke-width="1.5"/>` +
    `<line x1="${x1}" y1="${mid}" x2="${x2}" y2="${mid}" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="8 8"/>` +
    `<line x1="${x1}" y1="${base}" x2="${x2}" y2="${base}" stroke="#9ca3af" stroke-width="2"/>`
  );
}

function traceGlyphs(y: number, rowH: number, text: string, repeat: boolean): string {
  const base = y + rowH * 0.85;
  const fontSize = rowH * 0.72;
  const content = repeat
    ? `${text} `.repeat(
        Math.max(4, Math.floor((PAGE.w - 2 * PAGE.margin) / (fontSize * 0.7 * `${text} `.length))),
      )
    : text;
  return `<text x="${PAGE.margin + 16}" y="${base}" ${traceGlyphAttrs(fontSize)}>${escapeXml(content)}</text>`;
}

export function buildTracingPage(spec: ActivitySpec, opts: TracingOptions): ActivityResult {
  const headerSize = 90;
  const header = `<text x="${PAGE.w / 2}" y="${PAGE.bodyTop + 40}" text-anchor="middle" font-family="${SANS}" font-size="${headerSize}" font-weight="700" fill="#111">${escapeXml(opts.headerLine)}</text>`;

  const rowsTop = PAGE.bodyTop + 110;
  const available = PAGE.h - PAGE.margin - rowsTop;
  const rowH = available / opts.rows;
  const rowSvgs: string[] = [];
  for (let i = 0; i < opts.rows; i++) {
    const y = rowsTop + i * rowH;
    const guides = ruledRow(y, rowH);
    const glyphs = i < 2 ? traceGlyphs(y, rowH, opts.traceLine, opts.repeatTrace) : "";
    rowSvgs.push(guides + glyphs);
  }

  const body = titleBlock(spec.title, opts.instruction) + header + rowSvgs.join("");
  return { svg: svgDocument(body), meta: { trace: opts.traceLine } };
}
