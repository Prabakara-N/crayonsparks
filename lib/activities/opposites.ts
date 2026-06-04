import type { ActivityResult, ActivitySpec } from "./types";
import { makeRng, specSeed } from "./rng";
import { escapeXml, PAGE, SANS, svgDocument, titleBlock } from "./page";

const DEFAULT_OPPOSITES = [
  { left: "BIG", right: "SMALL" },
  { left: "UP", right: "DOWN" },
  { left: "HOT", right: "COLD" },
  { left: "DAY", right: "NIGHT" },
  { left: "FAST", right: "SLOW" },
  { left: "HAPPY", right: "SAD" },
  { left: "OPEN", right: "SHUT" },
  { left: "WET", right: "DRY" },
];

export function generateOpposites(spec: ActivitySpec): ActivityResult {
  const pairs = (spec.params.oppositePairs?.length ? spec.params.oppositePairs : DEFAULT_OPPOSITES).slice(0, 6);
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
      `<text x="${leftX}" y="${y + 8}" font-family="${SANS}" font-size="30" fill="#111">${escapeXml(p.left.toUpperCase())}</text>`,
      `<circle cx="${leftDotX}" cy="${y}" r="6" fill="#111"/>`,
    );
  });
  rightOrder.forEach((pi, j) => {
    const y = rowY(j);
    items.push(
      `<circle cx="${rightDotX}" cy="${y}" r="6" fill="#111"/>`,
      `<text x="${rightX}" y="${y + 8}" text-anchor="end" font-family="${SANS}" font-size="30" fill="#111">${escapeXml(pairs[pi].right.toUpperCase())}</text>`,
    );
  });

  const body =
    titleBlock(spec.title || "Match the Opposites", "Draw a line to join each pair of opposites.") +
    items.join("");

  const solution = pairs
    .map((_, i) => {
      const j = rightOrder.indexOf(i);
      return `<line x1="${leftDotX}" y1="${rowY(i)}" x2="${rightDotX}" y2="${rowY(j)}" stroke="#e11d48" stroke-width="2.5"/>`;
    })
    .join("");

  return {
    svg: svgDocument(body),
    solutionSvg: svgDocument(body + solution),
    meta: { pairs: pairs.length },
  };
}
