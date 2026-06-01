import type { ActivityResult, ActivitySpec } from "./types";
import { escapeXml, PAGE, SANS, svgDocument, titleBlock } from "./page";

export function generateSeekAndFind(spec: ActivitySpec, assetDataUrl?: string): ActivityResult {
  const findList = spec.params.findList?.length
    ? spec.params.findList
    : [{ label: "stars", count: 5 }, { label: "fish", count: 4 }, { label: "shells", count: 3 }];

  const sceneX = PAGE.margin;
  const sceneY = PAGE.bodyTop;
  const sceneW = PAGE.w - 2 * PAGE.margin;
  const sceneH = (PAGE.h - PAGE.bodyTop - PAGE.margin) * 0.7;

  const scene = assetDataUrl
    ? `<image href="${assetDataUrl}" x="${sceneX}" y="${sceneY}" width="${sceneW}" height="${sceneH}" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="${sceneX}" y="${sceneY}" width="${sceneW}" height="${sceneH}" fill="#f4f4f5"/>`;
  const frame = `<rect x="${sceneX}" y="${sceneY}" width="${sceneW}" height="${sceneH}" fill="none" stroke="#111" stroke-width="2"/>`;

  const cols = Math.min(findList.length, 4);
  const colW = sceneW / cols;
  const listY = sceneY + sceneH + 46;
  const buildList = (showCounts: boolean) =>
    findList
      .map((f, i) => {
        const x = PAGE.margin + (i % cols) * colW;
        const y = listY + Math.floor(i / cols) * 56;
        return (
          `<text x="${x}" y="${y}" font-family="${SANS}" font-size="20" fill="#111">${escapeXml(f.label)}</text>` +
          `<rect x="${x}" y="${y + 12}" width="46" height="36" rx="6" fill="none" stroke="#111" stroke-width="2"/>` +
          (showCounts
            ? `<text x="${x + 23}" y="${y + 38}" text-anchor="middle" font-family="${SANS}" font-size="22" font-weight="700" fill="#e11d48">${f.count}</text>`
            : "")
        );
      })
      .join("");

  const title = titleBlock(spec.title || "Seek & Find", "Find each thing in the picture. Write how many.");
  return {
    svg: svgDocument(title + scene + frame + buildList(false)),
    solutionSvg: svgDocument(title + scene + frame + buildList(true)),
    meta: { findList },
  };
}
