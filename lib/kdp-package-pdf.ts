"use client";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { KdpMetadata } from "./kdp-metadata";
import { buildKdpHtmlDocument } from "./kdp-html-export";

/**
 * Builds a one-or-two page PDF summarizing every KDP metadata field so the
 * user can paste each field into the Amazon KDP submission form quickly.
 *
 * Format: clean text-only PDF, 8.5x11 portrait, dark text on white.
 */
export interface KdpPackagePdfInput {
  bookName: string;
  pageCount: number;
  metadata: KdpMetadata;
}

const PAGE_W = 612; // 8.5"
const PAGE_H = 792; // 11"
const MARGIN = 54; // 0.75"
const LINE = 14; // line height

/**
 * pdf-lib's StandardFonts.Helvetica only supports WinAnsi encoding (a
 * subset of Latin-1). Any character above 0xFF (smart quotes, em-dashes,
 * the ≤ symbol used in our labels, AI-generated copy with stylized
 * punctuation, etc.) crashes the PDF build with "WinAnsi cannot encode".
 *
 * Rather than embed a TTF font (extra dep + ~150KB bundle hit), we
 * normalize common Unicode punctuation to ASCII equivalents before
 * drawing. Anything still > 0xFF after normalization is replaced with
 * "?" as a final safety net.
 */
function sanitizeForWinAnsi(text: string): string {
  return text
    .replace(/≤/g, "<=") // ≤
    .replace(/≥/g, ">=") // ≥
    .replace(/[—–]/g, "-") // — em-dash, – en-dash
    .replace(/[‘’]/g, "'") // ' ' smart single quotes
    .replace(/[“”]/g, '"') // " " smart double quotes
    .replace(/…/g, "...") // … ellipsis
    .replace(/ /g, " ") // non-breaking space → space
    .replace(/[•●]/g, "*") // • bullet, ● black circle
    .replace(/→/g, "->") // → arrow
    .replace(/[^\x00-\xFF]/g, "?"); // anything else outside Latin-1 → ?
}

const EMOJI_FALLBACKS: Array<[RegExp, string]> = [
  [/✨/g, "***"],
  [/\u{1F3AF}/gu, ">>>"],
  [/\u{1F4E5}/gu, "[DOWNLOAD]"],
  [/\u{1F5A8}️?/gu, "[PRINT]"],
  [/❌/g, "[X]"],
  [/✅/g, "[OK]"],
  [/\u{1F525}/gu, "[HOT]"],
  [/⭐/g, "[STAR]"],
  [/\u{1F4A1}/gu, "[TIP]"],
  [/\u{1F4DA}/gu, "[BOOK]"],
];

function sanitizeListingBlock(text: string): string {
  let out = text;
  for (const [re, replacement] of EMOJI_FALLBACKS) {
    out = out.replace(re, replacement);
  }
  return out;
}

export async function buildKdpPackagePdf(
  input: KdpPackagePdfInput,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${input.bookName} — KDP submission package`);
  doc.setAuthor("CrayonSparks");
  doc.setCreator("CrayonSparks");

  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  const black = rgb(0.07, 0.07, 0.07);
  const grey = rgb(0.4, 0.4, 0.42);
  const violet = rgb(0.55, 0.36, 0.96);

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  }

  function drawLabel(text: string) {
    ensureSpace(LINE * 2);
    page.drawText(sanitizeForWinAnsi(text).toUpperCase(), {
      x: MARGIN,
      y,
      size: 9,
      font: helvBold,
      color: violet,
    });
    y -= LINE;
  }

  function drawValue(text: string, opts: { mono?: boolean } = {}) {
    if (!text) {
      page.drawText("(empty)", {
        x: MARGIN,
        y,
        size: 10,
        font: helv,
        color: grey,
      });
      y -= LINE * 1.4;
      return;
    }
    const withFallbacks = sanitizeListingBlock(text);
    const font = opts.mono ? helv : helv;
    const maxWidth = PAGE_W - MARGIN * 2;
    const paragraphs = withFallbacks.split(/\r?\n/);
    paragraphs.forEach((rawPara, paraIdx) => {
      const para = sanitizeForWinAnsi(rawPara);
      if (!para.trim()) {
        ensureSpace(LINE);
        y -= LINE * 0.6;
        return;
      }
      const words = para.split(/\s+/);
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, 10) > maxWidth) {
          ensureSpace(LINE);
          page.drawText(line, { x: MARGIN, y, size: 10, font, color: black });
          y -= LINE;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) {
        ensureSpace(LINE);
        page.drawText(line, { x: MARGIN, y, size: 10, font, color: black });
        y -= LINE;
      }
      if (paraIdx < paragraphs.length - 1) {
        y -= LINE * 0.2;
      }
    });
    y -= LINE * 0.5;
  }

  // Header
  page.drawText("KDP SUBMISSION PACKAGE", {
    x: MARGIN,
    y,
    size: 18,
    font: helvBold,
    color: black,
  });
  y -= 22;
  page.drawText(sanitizeForWinAnsi(input.bookName), {
    x: MARGIN,
    y,
    size: 12,
    font: helv,
    color: grey,
  });
  y -= 28;

  // Title
  drawLabel("Book title (≤200 chars)");
  drawValue(input.metadata.title);

  // Subtitle
  if (input.metadata.subtitle) {
    drawLabel("Subtitle");
    drawValue(input.metadata.subtitle);
  }

  // Description (plain text version — easiest to paste)
  drawLabel("Description (plain text — paste into KDP description field)");
  drawValue(input.metadata.descriptionText);

  // HTML description — wrap in the SAME full standalone HTML document the
  // UI shows (DOCTYPE-ish skeleton with <html><head><title></title></head>
  // <body>…</body></html>) so the user can paste the entire block straight
  // into a .html file and preview it. Matches the on-screen Plain/HTML
  // toggle exactly.
  if (input.metadata.descriptionHtml) {
    drawLabel("Description (HTML — paste into a .html file to preview)");
    drawValue(
      buildKdpHtmlDocument({
        title: input.metadata.title || input.bookName,
        descriptionHtml: input.metadata.descriptionHtml,
      }),
      { mono: true },
    );
  }

  // Keywords
  drawLabel("7 backend keywords (paste one per field)");
  input.metadata.keywords.forEach((kw, i) => {
    drawValue(`${i + 1}. ${kw}`);
  });

  // Categories
  drawLabel("Suggested KDP browse categories (pick 2)");
  input.metadata.categories.forEach((cat, i) => {
    drawValue(`${i + 1}. ${cat}`);
  });

  // Pricing + page count
  drawLabel("Suggested retail price");
  drawValue(`$${input.metadata.suggestedPriceUsd} USD (${input.pageCount} pages)`);

  // Notes
  if (input.metadata.notes) {
    drawLabel("Notes");
    drawValue(input.metadata.notes);
  }

  if (input.metadata.etsy) {
    ensureSpace(LINE * 3);
    y -= LINE;
    page.drawText("ETSY LISTING (digital download)", {
      x: MARGIN,
      y,
      size: 14,
      font: helvBold,
      color: black,
    });
    y -= LINE * 1.6;
    drawLabel(`Etsy title (≤140 chars — ${input.metadata.etsy.title.length} used)`);
    drawValue(input.metadata.etsy.title);
    drawLabel("Etsy description (plain text)");
    drawValue(input.metadata.etsy.description);
    drawLabel("13 Etsy tags (≤20 chars each)");
    input.metadata.etsy.tags.forEach((tag, i) => {
      drawValue(`${i + 1}. ${tag}`);
    });
  }

  if (input.metadata.gumroad) {
    ensureSpace(LINE * 3);
    y -= LINE;
    page.drawText("GUMROAD LISTING", {
      x: MARGIN,
      y,
      size: 14,
      font: helvBold,
      color: black,
    });
    y -= LINE * 1.6;
    drawLabel(`Product name (${input.metadata.gumroad.name.length}/140)`);
    drawValue(input.metadata.gumroad.name);
    drawLabel(`One-line summary (${input.metadata.gumroad.summary.length}/280)`);
    drawValue(input.metadata.gumroad.summary);
    drawLabel("Description (paste into Gumroad description field)");
    drawValue(input.metadata.gumroad.description);
    drawLabel(`Additional information (${input.metadata.gumroad.additionalInfo.length} rows)`);
    input.metadata.gumroad.additionalInfo.forEach((row, i) => {
      drawValue(`${i + 1}. ${row.label} — ${row.value}`);
    });
    drawLabel("Tags");
    drawValue(input.metadata.gumroad.tags.join(", "));
    drawLabel("Category");
    drawValue(input.metadata.gumroad.category);
  }

  if (input.metadata.pinterest) {
    ensureSpace(LINE * 3);
    y -= LINE;
    page.drawText("PINTEREST PIN", {
      x: MARGIN,
      y,
      size: 14,
      font: helvBold,
      color: black,
    });
    y -= LINE * 1.6;
    drawLabel(`Pin title (${input.metadata.pinterest.title.length}/100)`);
    drawValue(input.metadata.pinterest.title);
    drawLabel(`Pin description (${input.metadata.pinterest.description.length}/800)`);
    drawValue(input.metadata.pinterest.description);
  }

  if (input.metadata.instagram) {
    ensureSpace(LINE * 3);
    y -= LINE;
    page.drawText("INSTAGRAM LAUNCH POST", {
      x: MARGIN,
      y,
      size: 14,
      font: helvBold,
      color: black,
    });
    y -= LINE * 1.6;
    drawLabel("Caption");
    drawValue(input.metadata.instagram.caption);
    drawLabel("Hashtags (5)");
    drawValue(input.metadata.instagram.hashtags.join("  "));
  }

  if (input.metadata.twitter) {
    ensureSpace(LINE * 3);
    y -= LINE;
    page.drawText("X / TWITTER LAUNCH POST", {
      x: MARGIN,
      y,
      size: 14,
      font: helvBold,
      color: black,
    });
    y -= LINE * 1.6;
    drawLabel(`Caption (${input.metadata.twitter.caption.length}/280)`);
    drawValue(input.metadata.twitter.caption);
  }

  // Footer
  ensureSpace(40);
  y = MARGIN - 6;
  page.drawText(
    sanitizeForWinAnsi(
      `Generated by CrayonSparks · ${new Date().toLocaleDateString("en-US")}`,
    ),
    { x: MARGIN, y, size: 8, font: helv, color: grey },
  );

  return await doc.save();
}
