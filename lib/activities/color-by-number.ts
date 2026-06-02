import type { ActivityResult, ActivitySpec } from "./types";
import { escapeXml, PAGE, SANS, svgDocument, titleBlock } from "./page";

export function generateColorByNumber(spec: ActivitySpec, assetDataUrl?: string): ActivityResult {
  const legend = spec.params.paletteLegend?.length
    ? spec.params.paletteLegend
    : [
        { n: 1, label: "red" },
        { n: 2, label: "blue" },
        { n: 3, label: "green" },
        { n: 4, label: "yellow" },
      ];

  const sceneX = PAGE.margin;
  const sceneY = PAGE.bodyTop;
  const sceneW = PAGE.w - 2 * PAGE.margin;
  const sceneH = (PAGE.h - PAGE.bodyTop - PAGE.margin) * 0.78;

  const scene = assetDataUrl
    ? `<image href="${assetDataUrl}" x="${sceneX}" y="${sceneY}" width="${sceneW}" height="${sceneH}" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="${sceneX}" y="${sceneY}" width="${sceneW}" height="${sceneH}" fill="#fafafa"/>`;
  const frame = `<rect x="${sceneX}" y="${sceneY}" width="${sceneW}" height="${sceneH}" fill="none" stroke="#111" stroke-width="2"/>`;

  // B&W legend — KDP interiors print in black & white, so a colored chip
  // would render as muddy grey. Show the number in an outlined box plus the
  // color NAME in black text so the child knows which crayon to use.
  const legendY = sceneY + sceneH + 44;
  const cols = Math.min(legend.length, 4);
  const colW = sceneW / cols;
  const swatches = legend
    .map((l, i) => {
      const x = PAGE.margin + (i % cols) * colW;
      const y = legendY + Math.floor(i / cols) * 50;
      return (
        `<rect x="${x}" y="${y - 22}" width="30" height="30" rx="6" fill="none" stroke="#111" stroke-width="2"/>` +
        `<text x="${x + 15}" y="${y - 1}" text-anchor="middle" font-family="${SANS}" font-size="18" font-weight="700" fill="#111">${l.n}</text>` +
        `<text x="${x + 40}" y="${y}" font-family="${SANS}" font-size="18" fill="#111">= ${escapeXml(l.label.toUpperCase())}</text>`
      );
    })
    .join("");

  return {
    svg: svgDocument(
      titleBlock(spec.title || "Color by Number", "Color each area using the number key below.") + scene + frame + swatches,
    ),
    meta: { legend },
  };
}
