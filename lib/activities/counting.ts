import type { ActivityResult, ActivitySpec } from "./types";
import { makeRng, specSeed } from "./rng";
import { PAGE, SANS, svgDocument, titleBlock } from "./page";

const RANGE: Record<string, number> = { easy: 5, medium: 10, hard: 15 };

function dots(count: number, bx: number, by: number, bw: number): string {
  const perRow = Math.ceil(Math.sqrt(count * 1.4));
  const r = Math.min(16, (bw - 30) / (perRow * 2.4));
  const gapX = (bw - 30) / perRow;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const cx = bx + 18 + col * gapX + gapX / 2;
    const cy = by + 30 + row * (r * 2 + 10);
    out.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="#111"/>`);
  }
  return out.join("");
}

export function generateCounting(spec: ActivitySpec): ActivityResult {
  const rng = makeRng(specSeed(spec.params.seed, spec.id));
  const max = RANGE[spec.difficulty] ?? 10;
  const cols = 2;
  const rowsN = 3;
  const total = cols * rowsN;
  const counts: number[] = [];
  for (let i = 0; i < total; i++) {
    counts.push(spec.params.counts?.[i] ?? rng.int(max) + 1);
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
      dots(count, bx, by, boxW),
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
