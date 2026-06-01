import type { ActivityResult, ActivitySpec } from "./types";
import { makeRng, specSeed } from "./rng";
import { PAGE, svgDocument, titleBlock } from "./page";

const DIFF_COUNT: Record<string, number> = { easy: 4, medium: 5, hard: 6 };

function mark(x: number, y: number, kind: number): string {
  if (kind % 3 === 0) return `<circle cx="${x}" cy="${y}" r="9" fill="#111"/>`;
  if (kind % 3 === 1) {
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 === 0 ? 11 : 5;
      pts.push(`${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(" ")}" fill="#111"/>`;
  }
  return `<path d="M ${x} ${y + 6} C ${x - 9} ${y - 4}, ${x - 3} ${y - 9}, ${x} ${y - 3} C ${x + 3} ${y - 9}, ${x + 9} ${y - 4}, ${x} ${y + 6} Z" fill="#111"/>`;
}

export function generateSpotDifference(spec: ActivitySpec, assetDataUrl?: string): ActivityResult {
  const count = spec.params.differenceCount ?? DIFF_COUNT[spec.difficulty] ?? 5;
  const rng = makeRng(specSeed(spec.params.seed, spec.id));

  const imgX = PAGE.margin;
  const imgW = PAGE.w - 2 * PAGE.margin;
  const gap = 24;
  const availH = PAGE.h - PAGE.bodyTop - PAGE.margin - gap;
  const imgH = availH / 2;
  const topY = PAGE.bodyTop;
  const bottomY = topY + imgH + gap;

  const imageEl = (y: number) =>
    assetDataUrl
      ? `<image href="${assetDataUrl}" x="${imgX}" y="${y}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="${imgX}" y="${y}" width="${imgW}" height="${imgH}" fill="#f4f4f5"/>`;
  const frame = (y: number) => `<rect x="${imgX}" y="${y}" width="${imgW}" height="${imgH}" fill="none" stroke="#111" stroke-width="2"/>`;
  const labelLeft = `<text x="${imgX + 8}" y="${topY - 8}" font-family="sans-serif" font-size="18" fill="#111">Picture 1</text>`;
  const labelRight = `<text x="${imgX + 8}" y="${bottomY - 8}" font-family="sans-serif" font-size="18" fill="#111">Picture 2 — find ${count}</text>`;

  const pad = 40;
  const positions: [number, number][] = [];
  let guard = 0;
  while (positions.length < count && guard < 400) {
    guard++;
    const x = imgX + pad + rng.int(imgW - pad * 2);
    const y = bottomY + pad + rng.int(imgH - pad * 2);
    if (positions.every(([px, py]) => Math.hypot(px - x, py - y) > 70)) positions.push([x, y]);
  }
  const marks = positions.map(([x, y], i) => mark(x, y, i)).join("");

  const title = titleBlock(spec.title || "Spot the Difference", `Find the ${count} extra things added to Picture 2.`);
  const base = title + imageEl(topY) + frame(topY) + labelLeft + imageEl(bottomY) + marks + frame(bottomY) + labelRight;

  const circles = positions
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="22" fill="none" stroke="#e11d48" stroke-width="3"/>`)
    .join("");

  return {
    svg: svgDocument(base),
    solutionSvg: svgDocument(base + circles),
    meta: { differenceCount: count, positions },
  };
}
