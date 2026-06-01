import type { ActivityResult, ActivitySpec } from "./types";
import { makeRng, specSeed } from "./rng";
import { iconSvg } from "./icons";
import { escapeXml, PAGE, SANS, svgDocument, titleBlock } from "./page";

// `left` is the word the child reads; `right` is an icon name from the icon
// library, drawn as a picture so pre-readers can match word -> image.
const DEFAULT_PAIRS = [
  { left: "STAR", right: "star" },
  { left: "SUN", right: "sun" },
  { left: "FISH", right: "fish" },
  { left: "TREE", right: "tree" },
  { left: "HOUSE", right: "house" },
];

export function generateMatching(spec: ActivitySpec): ActivityResult {
  const pairs = (spec.params.pairs?.length ? spec.params.pairs : DEFAULT_PAIRS).slice(0, 6);
  const rng = makeRng(specSeed(spec.params.seed, spec.id));
  const rightOrder = rng.shuffle(pairs.map((_, i) => i));

  const top = PAGE.bodyTop + 40;
  const rowGap = (PAGE.h - PAGE.margin - top) / pairs.length;
  const leftX = PAGE.margin + 40;
  const rightX = PAGE.w - PAGE.margin - 40;
  const leftDotX = PAGE.w / 2 - 150;
  const rightDotX = PAGE.w / 2 + 150;

  const rowY = (i: number) => top + rowGap * i + rowGap / 2;

  const items: string[] = [];
  pairs.forEach((p, i) => {
    const y = rowY(i);
    items.push(
      `<text x="${leftX}" y="${y + 8}" font-family="${SANS}" font-size="30" fill="#111">${escapeXml(p.left)}</text>`,
      `<circle cx="${leftDotX}" cy="${y}" r="6" fill="#111"/>`,
    );
  });
  const iconSize = Math.min(72, rowGap * 0.62);
  const iconCx = (rightDotX + rightX) / 2 + 10;
  rightOrder.forEach((pi, j) => {
    const y = rowY(j);
    items.push(
      `<circle cx="${rightDotX}" cy="${y}" r="6" fill="#111"/>`,
      iconSvg(pairs[pi].right, iconCx, y, iconSize, 3),
    );
  });

  const body =
    titleBlock(spec.title || "Match Them Up", "Draw a line to match each pair.") + items.join("");

  const solutionLines = pairs
    .map((_, i) => {
      const j = rightOrder.indexOf(i);
      return `<line x1="${leftDotX}" y1="${rowY(i)}" x2="${rightDotX}" y2="${rowY(j)}" stroke="#e11d48" stroke-width="2.5"/>`;
    })
    .join("");

  return {
    svg: svgDocument(body),
    solutionSvg: svgDocument(body + solutionLines),
    meta: { pairs: pairs.length },
  };
}
