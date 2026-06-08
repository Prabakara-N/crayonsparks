/**
 * Story-book PDF assembler — Phase 1 (toddler band, 6x9 portrait).
 *
 * Different from `lib/pdf.ts` (coloring books):
 *   - Full-bleed: every image fills the entire trim area, no margins.
 *   - No blank facing pages: color print uses both sides of the sheet.
 *   - No CSS-style border overlay: story books are full-bleed art.
 *   - Default trim 6x9" portrait (KDP color paperback standard).
 *
 * Bleed: KDP full-bleed interiors need the page sized to trim + 0.125" width
 * and + 0.25" height, with art filling the whole page. Pass bleedWidthInches /
 * bleedHeightInches for the KDP target; the home-print Etsy variants leave them
 * 0 (standard paper has no bleed). drawFullBleed fills whatever page size it's
 * given, so the art always reaches every edge.
 */

import { PDFDocument, type PDFImage } from "pdf-lib";

const INCH_TO_PT = 72;

export interface StoryPageInput {
  id: string;
  name: string;
  dataUrl: string;
}

export interface AssembleStoryBookOptions {
  title?: string;
  author?: string;
  cover?: { dataUrl: string };
  backCover?: { dataUrl: string };
  pages: StoryPageInput[];
  trimWidthInches?: number;
  trimHeightInches?: number;
  // KDP full-bleed interior: 0.125" added to width, 0.25" to height. Left 0
  // for the home-print Etsy variants (standard paper has no bleed).
  bleedWidthInches?: number;
  bleedHeightInches?: number;
}

function decodeDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } {
  if (!dataUrl.startsWith("data:")) throw new Error("Invalid data URL");
  const sep = dataUrl.indexOf(";base64,");
  if (sep < 0) throw new Error("Invalid data URL");
  const mime = dataUrl.slice(5, sep);
  const b64 = dataUrl.slice(sep + 8);
  if (!mime || !b64) throw new Error("Invalid data URL");
  const binary = Buffer.from(b64, "base64");
  return { mime, bytes: new Uint8Array(binary) };
}

async function embedImage(
  doc: PDFDocument,
  dataUrl: string,
): Promise<PDFImage> {
  const { mime, bytes } = decodeDataUrl(dataUrl);
  if (mime === "image/png") return doc.embedPng(bytes);
  if (mime === "image/jpeg" || mime === "image/jpg") return doc.embedJpg(bytes);
  throw new Error(`Unsupported image type: ${mime}`);
}

function drawFullBleed(
  page: ReturnType<PDFDocument["addPage"]>,
  image: PDFImage,
  pageWidthPt: number,
  pageHeightPt: number,
): void {
  const imgRatio = image.width / image.height;
  const pageRatio = pageWidthPt / pageHeightPt;

  let drawWidth: number;
  let drawHeight: number;
  if (imgRatio > pageRatio) {
    drawHeight = pageHeightPt;
    drawWidth = pageHeightPt * imgRatio;
  } else {
    drawWidth = pageWidthPt;
    drawHeight = pageWidthPt / imgRatio;
  }
  const x = (pageWidthPt - drawWidth) / 2;
  const y = (pageHeightPt - drawHeight) / 2;
  page.drawImage(image, { x, y, width: drawWidth, height: drawHeight });
}

export async function assembleStoryBookPdf(
  opts: AssembleStoryBookOptions,
): Promise<Uint8Array> {
  if (opts.pages.length === 0) {
    throw new Error("Story book PDF requires at least one page.");
  }

  const trimWidth = opts.trimWidthInches ?? 6.0;
  const trimHeight = opts.trimHeightInches ?? 9.0;
  const pageWidthPt = (trimWidth + (opts.bleedWidthInches ?? 0)) * INCH_TO_PT;
  const pageHeightPt =
    (trimHeight + (opts.bleedHeightInches ?? 0)) * INCH_TO_PT;

  const doc = await PDFDocument.create();
  doc.setTitle(opts.title ?? "CrayonSparks story book");
  doc.setAuthor(opts.author ?? "CrayonSparks");
  doc.setCreator("CrayonSparks");
  doc.setProducer("CrayonSparks");

  if (opts.cover) {
    const coverImage = await embedImage(doc, opts.cover.dataUrl);
    const page = doc.addPage([pageWidthPt, pageHeightPt]);
    drawFullBleed(page, coverImage, pageWidthPt, pageHeightPt);
  }

  for (const pageInput of opts.pages) {
    const image = await embedImage(doc, pageInput.dataUrl);
    const page = doc.addPage([pageWidthPt, pageHeightPt]);
    drawFullBleed(page, image, pageWidthPt, pageHeightPt);
  }

  if (opts.backCover) {
    const backImage = await embedImage(doc, opts.backCover.dataUrl);
    const page = doc.addPage([pageWidthPt, pageHeightPt]);
    drawFullBleed(page, backImage, pageWidthPt, pageHeightPt);
  }

  return doc.save();
}
