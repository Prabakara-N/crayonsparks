import type { ActivityResult, ActivitySpec } from "./types";
import { makeRng, specSeed } from "./rng";
import { escapeXml, PAGE, SANS, svgDocument, titleBlock } from "./page";

const DEFAULT_PAIRS = [
  { left: "1", right: "one" },
  { left: "2", right: "two" },
  { left: "3", right: "three" },
  { left: "4", right: "four" },
  { left: "5", right: "five" },
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
  rightOrder.forEach((pi, j) => {
    const y = rowY(j);
    items.push(
      `<circle cx="${rightDotX}" cy="${y}" r="6" fill="#111"/>`,
      `<text x="${rightX}" y="${y + 8}" text-anchor="end" font-family="${SANS}" font-size="30" fill="#111">${escapeXml(pairs[pi].right)}</text>`,
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
