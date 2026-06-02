import { PDFDocument, StandardFonts, rgb, PDFImage } from "pdf-lib";

const INCH_TO_PT = 72;
// Default trim. Overridable per-call via AssembleOptions.trimWidthInches /
// trimHeightInches (used by the Etsy A4 variant).
const DEFAULT_PAGE_WIDTH = 8.5 * INCH_TO_PT;
const DEFAULT_PAGE_HEIGHT = 11 * INCH_TO_PT;
// KDP-compliant interior page margins (matches the published spec at
// https://kdp.amazon.com/en_US/help/topic/G201834260):
//   - Outside / top / bottom: 0.25" minimum (no-bleed page)
//   - Gutter (inside): 0.375" minimum for books ≤ 150 pages
// Going below these values causes KDP to flag the interior PDF on upload,
// even when no artwork extends to the edge. Earlier we had these at
// 0.125" / 0.25" to let the AI border sit closer to the edge — but that
// violated KDP minimums. The AI-drawn border is at 3% inset INSIDE the
// generated image, so trimming the page margin tighter doesn't help.
const MARGIN_OUTER = 0.25 * INCH_TO_PT;
const MARGIN_GUTTER = 0.375 * INCH_TO_PT;

export interface PdfPageInput {
  id: string;
  name: string;
  dataUrl: string;
}

export interface AssembleOptions {
  title?: string;
  category: string;
  pages: PdfPageInput[];
  cover?: { dataUrl: string };
  backCover?: { dataUrl: string };
  belongsTo?: { dataUrl: string; style: "bw" | "color" };
  includeTitlePage?: boolean;
  includeBlankPages?: boolean;
  interiorOnly?: boolean;
  trimWidthInches?: number;
  trimHeightInches?: number;
  // Activity-book extras (ignored by the coloring/story flows that don't set them):
  solutionPages?: PdfPageInput[];
  licensePageDataUrl?: string;
  answerDividerDataUrl?: string;
  pageBorder?: boolean;
}

function decodeDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } {
  // String-based parsing — regex backtracking on multi-MB base64 caused V8
  // stack overflow ("RangeError: Maximum call stack size exceeded").
  if (!dataUrl.startsWith("data:")) throw new Error("Invalid data URL");
  const sep = dataUrl.indexOf(";base64,");
  if (sep < 0) throw new Error("Invalid data URL");
  const mime = dataUrl.slice(5, sep);
  const b64 = dataUrl.slice(sep + 8);
  if (!mime || !b64) throw new Error("Invalid data URL");
  const binary = Buffer.from(b64, "base64");
  return { mime, bytes: new Uint8Array(binary) };
}

async function embedImage(doc: PDFDocument, dataUrl: string): Promise<PDFImage> {
  const { mime, bytes } = decodeDataUrl(dataUrl);
  if (mime === "image/png") return doc.embedPng(bytes);
  if (mime === "image/jpeg" || mime === "image/jpg") return doc.embedJpg(bytes);
  throw new Error(`Unsupported image type: ${mime}`);
}

// Scale an image to fit (contain) inside a box, preserving aspect ratio.
function fitContain(img: PDFImage, boxW: number, boxH: number): { w: number; h: number } {
  const imgRatio = img.width / img.height;
  const boxRatio = boxW / boxH;
  return imgRatio > boxRatio ? { w: boxW, h: boxW / imgRatio } : { w: boxH * imgRatio, h: boxH };
}

export async function assembleColoringBookPdf(opts: AssembleOptions): Promise<Uint8Array> {
  // interiorOnly mode skips both covers — KDP wants the cover wrap as a
  // separate PDF (see lib/kdp-cover-pdf.ts), so the interior PDF contains
  // ONLY the belongs-to page + numbered content pages.
  const interiorOnly = opts.interiorOnly === true;

  // Per-call trim (defaults to 8.5×11 Letter). Used by the A4 variant in
  // the Etsy/Gumroad flow. Locals shadow the module-level defaults so the
  // existing references throughout this function pick up the overrides.
  const PAGE_WIDTH = (opts.trimWidthInches ?? 8.5) * INCH_TO_PT;
  const PAGE_HEIGHT = (opts.trimHeightInches ?? 11) * INCH_TO_PT;
  const hasCover = !!opts.cover && !interiorOnly;
  const includeTitle = opts.includeTitlePage ?? !hasCover;
  const includeBlanks = opts.includeBlankPages ?? true;

  const doc = await PDFDocument.create();
  doc.setTitle(opts.title ?? `CrayonSparks · ${opts.category}`);
  doc.setAuthor("CrayonSparks");
  doc.setCreator("CrayonSparks");
  doc.setProducer("CrayonSparks");
  const now = new Date();
  doc.setCreationDate(now);
  doc.setModificationDate(now);

  // KDP rejects books with non-embedded base-14 fonts, so we avoid pdf-lib
  // text entirely: the license + answer-key pages come in as rendered images,
  // and the only text-drawing path left (the no-cover fallback title page)
  // embeds a StandardFont lazily, so a font is added ONLY if that path runs.
  if (hasCover && opts.cover) {
    const cover = await embedImage(doc, opts.cover.dataUrl);
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    // KDP covers must be FULL BLEED — no white margins at any edge.
    // Use object-cover semantics: scale up so the image FILLS the page,
    // cropping the longer dimension slightly if aspect ratios don't match
    // exactly (Gemini's 3:4 output may not perfectly match 8.5:11).
    const imgRatio = cover.width / cover.height;
    const pageRatio = PAGE_WIDTH / PAGE_HEIGHT;
    let drawW: number;
    let drawH: number;
    if (imgRatio > pageRatio) {
      // Image wider than page → match height, overflow horizontally
      drawH = PAGE_HEIGHT;
      drawW = PAGE_HEIGHT * imgRatio;
    } else {
      // Image narrower than page → match width, overflow vertically
      drawW = PAGE_WIDTH;
      drawH = PAGE_WIDTH / imgRatio;
    }
    const drawX = (PAGE_WIDTH - drawW) / 2;
    const drawY = (PAGE_HEIGHT - drawH) / 2;
    page.drawImage(cover, { x: drawX, y: drawY, width: drawW, height: drawH });
  }

  // "This Book Belongs To" page — page 2, between cover and content.
  if (opts.belongsTo) {
    const bp = await embedImage(doc, opts.belongsTo.dataUrl);
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    if (opts.belongsTo.style === "color") {
      // Full-bleed like the cover — purely decorative page.
      const imgRatio = bp.width / bp.height;
      const pageRatio = PAGE_WIDTH / PAGE_HEIGHT;
      let drawW: number;
      let drawH: number;
      if (imgRatio > pageRatio) {
        drawH = PAGE_HEIGHT;
        drawW = PAGE_HEIGHT * imgRatio;
      } else {
        drawW = PAGE_WIDTH;
        drawH = PAGE_WIDTH / imgRatio;
      }
      const drawX = (PAGE_WIDTH - drawW) / 2;
      const drawY = (PAGE_HEIGHT - drawH) / 2;
      page.drawImage(bp, { x: drawX, y: drawY, width: drawW, height: drawH });
    } else {
      // B&W coloring-style page — same border + drawable area treatment
      // as content pages, so the kid can color it within the same frame.
      const drawable = {
        x: MARGIN_OUTER,
        y: MARGIN_OUTER,
        w: PAGE_WIDTH - MARGIN_OUTER * 2,
        h: PAGE_HEIGHT - 2 * MARGIN_OUTER,
      };
      const imgRatio = bp.width / bp.height;
      const boxRatio = drawable.w / drawable.h;
      let drawW = drawable.w;
      let drawH = drawable.h;
      if (imgRatio > boxRatio) {
        drawH = drawable.w / imgRatio;
      } else {
        drawW = drawable.h * imgRatio;
      }
      const drawX = drawable.x + (drawable.w - drawW) / 2;
      const drawY = drawable.y + (drawable.h - drawH) / 2;
      page.drawImage(bp, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
      });
      // Vector printer border — drawn TIGHT around the image rectangle so
      // the line sits flush against the artwork (no white matte). Same
      // style as the interior pages so the whole book reads as one set.
      page.drawRectangle({
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5,
      });
    }
    // Blank-back convention: keep the first activity on a right-hand page.
    // When a license page follows, IT occupies the left slot after belongs-to
    // (so activities land on the right) — so only add this filler blank when
    // there's no license page to play that role.
    if (
      (opts.includeBlankPages ?? true) &&
      opts.belongsTo.style === "bw" &&
      !opts.licensePageDataUrl
    ) {
      doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    }
  }

  // License / copyright page — rendered upstream as an image (no embedded
  // fonts), drawn within the safe margins like a content page.
  if (opts.licensePageDataUrl) {
    const img = await embedImage(doc, opts.licensePageDataUrl);
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const boxW = PAGE_WIDTH - MARGIN_OUTER * 2;
    const boxH = PAGE_HEIGHT - MARGIN_OUTER * 2;
    const { w, h } = fitContain(img, boxW, boxH);
    page.drawImage(img, {
      x: (PAGE_WIDTH - w) / 2,
      y: (PAGE_HEIGHT - h) / 2,
      width: w,
      height: h,
    });
  }

  // No-cover fallback title page. This is the ONLY remaining text path; it
  // lazily embeds a StandardFont so a font is added only when this runs (our
  // activity/coloring flows always have a cover, so it never does).
  if (!opts.cover && includeTitle) {
    const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const titleSize = 40;
    const title = opts.title ?? "Coloring Book";
    const titleLines = wrapText(title, titleFont, titleSize, PAGE_WIDTH - MARGIN_OUTER * 4);
    let y = PAGE_HEIGHT - 3 * INCH_TO_PT;
    for (const line of titleLines) {
      const w = titleFont.widthOfTextAtSize(line, titleSize);
      page.drawText(line, {
        x: (PAGE_WIDTH - w) / 2,
        y,
        size: titleSize,
        font: titleFont,
        color: rgb(0.05, 0.05, 0.1),
      });
      y -= titleSize * 1.15;
    }
  }

  for (const input of opts.pages) {
    const embedded = await embedImage(doc, input.dataUrl);
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const drawable = {
      x: MARGIN_GUTTER,
      y: MARGIN_OUTER,
      w: PAGE_WIDTH - MARGIN_GUTTER * 2,
      h: PAGE_HEIGHT - 2 * MARGIN_OUTER,
    };
    const imgRatio = embedded.width / embedded.height;
    const boxRatio = drawable.w / drawable.h;
    let drawW = drawable.w;
    let drawH = drawable.h;
    if (imgRatio > boxRatio) {
      drawH = drawable.w / imgRatio;
    } else {
      drawW = drawable.h * imgRatio;
    }
    const drawX = drawable.x + (drawable.w - drawW) / 2;
    const drawY = drawable.y + (drawable.h - drawH) / 2;
    page.drawImage(embedded, { x: drawX, y: drawY, width: drawW, height: drawH });

    // Vector printer border — drawn TIGHT around the rendered image
    // rectangle (same x/y/w/h as the image), so the border sits exactly
    // on the outermost edge of the artwork with NO white matte between
    // image and border. Skipped for activity pages, which already carry
    // their own frame inside the artwork.
    if (opts.pageBorder !== false) {
      page.drawRectangle({
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5,
      });
    }

    if (includeBlanks) doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  }

  // Answer-key section — grouped at the BACK (KDP/Etsy norm: never on the
  // puzzle page). A divider page, then each solution captioned with its
  // activity name so the key is bound to its puzzle.
  if (opts.solutionPages?.length) {
    // Divider rendered upstream as an image (no embedded fonts).
    if (opts.answerDividerDataUrl) {
      const img = await embedImage(doc, opts.answerDividerDataUrl);
      const divider = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      const boxW = PAGE_WIDTH - MARGIN_OUTER * 2;
      const boxH = PAGE_HEIGHT - MARGIN_OUTER * 2;
      const { w, h } = fitContain(img, boxW, boxH);
      divider.drawImage(img, {
        x: (PAGE_WIDTH - w) / 2,
        y: (PAGE_HEIGHT - h) / 2,
        width: w,
        height: h,
      });
    }

    // Answer key prints back-to-back — no blank fillers between solutions.
    for (const input of opts.solutionPages) {
      const embedded = await embedImage(doc, input.dataUrl);
      const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      const drawable = {
        x: MARGIN_GUTTER,
        y: MARGIN_OUTER,
        w: PAGE_WIDTH - MARGIN_GUTTER * 2,
        h: PAGE_HEIGHT - 2 * MARGIN_OUTER,
      };
      const imgRatio = embedded.width / embedded.height;
      const boxRatio = drawable.w / drawable.h;
      let drawW = drawable.w;
      let drawH = drawable.h;
      if (imgRatio > boxRatio) drawH = drawable.w / imgRatio;
      else drawW = drawable.h * imgRatio;
      const drawX = drawable.x + (drawable.w - drawW) / 2;
      const drawY = drawable.y + (drawable.h - drawH) / 2;
      page.drawImage(embedded, { x: drawX, y: drawY, width: drawW, height: drawH });
    }
  }

  // Back cover — final page, FULL BLEED (matches front cover treatment).
  // Same object-cover semantics — scale to fill, crop excess if needed.
  if (opts.backCover && !interiorOnly) {
    const back = await embedImage(doc, opts.backCover.dataUrl);
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const imgRatio = back.width / back.height;
    const pageRatio = PAGE_WIDTH / PAGE_HEIGHT;
    let drawW: number;
    let drawH: number;
    if (imgRatio > pageRatio) {
      drawH = PAGE_HEIGHT;
      drawW = PAGE_HEIGHT * imgRatio;
    } else {
      drawW = PAGE_WIDTH;
      drawH = PAGE_WIDTH / imgRatio;
    }
    const drawX = (PAGE_WIDTH - drawW) / 2;
    const drawY = (PAGE_HEIGHT - drawH) / 2;
    page.drawImage(back, { x: drawX, y: drawY, width: drawW, height: drawH });
  }

  return doc.save();
}

function wrapText(text: string, font: ReturnType<PDFDocument["embedFont"]> extends Promise<infer T> ? T : never, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const w = font.widthOfTextAtSize(candidate, size);
    if (w > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}
