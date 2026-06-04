import type { ActivityResult, ActivitySpec } from "./types";
import { makeRng, specSeed } from "./rng";
import { drawObject, type ObjectAssets } from "./object-draw";
import { PAGE, SANS, svgDocument, titleBlock } from "./page";

const RANGE: Record<string, number> = { easy: 5, medium: 8, hard: 12 };

// Lays icons inside the box's UPPER region only — `areaH` excludes the
// bottom "How many?" + answer-box strip so icons never overlap the text.
function shapes(count: number, icon: string, bx: number, by: number, bw: number, areaH: number, objects?: ObjectAssets): string {
  const perRow = Math.min(count, Math.max(2, Math.ceil(Math.sqrt(count * 1.5))));
  const rows = Math.ceil(count / perRow);
  const cellW = (bw - 36) / perRow;
  const cellH = areaH / rows;
  const iconSize = Math.max(20, Math.min(60, cellW * 0.72, cellH * 0.8));
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const cx = bx + 18 + col * cellW + cellW / 2;
    const cy = by + 24 + row * cellH + cellH / 2;
    out.push(drawObject(objects, icon, cx, cy, iconSize, 3));
  }
  return out.join("");
}

export function generateCounting(spec: ActivitySpec, objects?: ObjectAssets): ActivityResult {
  const rng = makeRng(specSeed(spec.params.seed, spec.id));
  const max = RANGE[spec.difficulty] ?? 8;
  const icon = spec.params.icon ?? "star";
  const cols = 2;
  const rowsN = 3;
  const total = cols * rowsN;
  // Spread counts so boxes differ: shuffle 1..max, then walk the shuffled
  // pool (wraps if there are more boxes than distinct values).
  const pool = rng.shuffle(Array.from({ length: max }, (_, k) => k + 1));
  const counts: number[] = [];
  for (let i = 0; i < total; i++) {
    counts.push(spec.params.counts?.[i] ?? pool[i % pool.length]);
  }

  const top = PAGE.bodyTop + 20;
  const boxW = (PAGE.w - 2 * PAGE.margin - 30) / cols;
  const boxH = (PAGE.h - PAGE.margin - top - 30 * (rowsN - 1)) / rowsN;

  const boxes: string[] = [];
  const answers: string[] = [];
  counts.forEach((count, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const bx = PAGE.margin + col * (boxW + 30);
    const by = top + row * (boxH + 30);
    boxes.push(
      `<rect x="${bx}" y="${by}" width="${boxW}" height="${boxH}" rx="14" fill="none" stroke="#9ca3af" stroke-width="2"/>`,
      shapes(count, icon, bx, by, boxW, boxH - 72, objects),
      `<rect x="${bx + boxW - 70}" y="${by + boxH - 60}" width="50" height="44" rx="8" fill="none" stroke="#111" stroke-width="2"/>`,
      `<text x="${bx + 20}" y="${by + boxH - 26}" font-family="${SANS}" font-size="22" fill="#444">How many?</text>`,
    );
    answers.push(
      `<text x="${bx + boxW - 45}" y="${by + boxH - 26}" text-anchor="middle" font-family="${SANS}" font-size="30" font-weight="700" fill="#e11d48">${count}</text>`,
    );
  });

  const body = titleBlock(spec.title || "Count & Write", "Count the shapes. Write how many.") + boxes.join("");
  return {
    svg: svgDocument(body),
    solutionSvg: svgDocument(body + answers.join("")),
    meta: { counts },
  };
}
