import type { ActivityResult, ActivitySpec } from "./types";
import { PAGE, SANS, svgDocument, titleBlock } from "./page";

// Color-by-reference page: a small COLOR reference picture near the top, then
// the SAME picture large in black-and-white below for the child to color in.
export function generateColorReference(
  spec: ActivitySpec,
  colorDataUrl?: string,
  bwDataUrl?: string,
): ActivityResult {
  const refSize = 190;
  const refX = (PAGE.w - refSize) / 2;
  const refY = PAGE.bodyTop;

  const refImg = colorDataUrl
    ? `<image href="${colorDataUrl}" x="${refX}" y="${refY}" width="${refSize}" height="${refSize}" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="${refX}" y="${refY}" width="${refSize}" height="${refSize}" fill="#f4f4f5"/>`;
  const refBox = `<rect x="${refX}" y="${refY}" width="${refSize}" height="${refSize}" rx="12" fill="none" stroke="#111" stroke-width="2"/>`;
  const refCaption = `<text x="${PAGE.w / 2}" y="${refY + refSize + 30}" text-anchor="middle" font-family="${SANS}" font-size="22" font-weight="700" fill="#111">Color to match</text>`;

  const bwY = refY + refSize + 56;
  const bwX = PAGE.margin;
  const bwW = PAGE.w - 2 * PAGE.margin;
  const bwH = PAGE.h - PAGE.margin - bwY;
  const bwImg = bwDataUrl
    ? `<image href="${bwDataUrl}" x="${bwX}" y="${bwY}" width="${bwW}" height="${bwH}" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="${bwX}" y="${bwY}" width="${bwW}" height="${bwH}" fill="#fafafa"/>`;

  const title = titleBlock(
    spec.title || "Color the Picture",
    "Color the big picture to match the small one.",
  );
  return {
    svg: svgDocument(title + refImg + refBox + refCaption + bwImg),
    meta: {},
  };
}
