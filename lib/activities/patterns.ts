import type { ActivityResult, ActivitySpec } from "./types";
import { makeRng, specSeed } from "./rng";
import { ICON_NAMES } from "./icons";
import { drawObject, type ObjectAssets } from "./object-draw";
import { PAGE, svgDocument, titleBlock } from "./page";

const ROWS_BY_DIFF: Record<string, number> = { easy: 3, medium: 4, hard: 5 };

// Repeating-unit templates as indices into a small per-row icon set (AB, AAB…).
const UNITS = [
  [0, 1],
  [0, 0, 1],
  [0, 1, 2],
  [0, 1, 1],
];

const f = (n: number) => n.toFixed(1);

export function generatePatterns(spec: ActivitySpec, objects?: ObjectAssets): ActivityResult {
  const rng = makeRng(specSeed(spec.params.seed, spec.id));
  const requested = (spec.params.iconNames ?? []).map((n) => n.toLowerCase());
  const usable = objects ? requested : requested.filter((n) => ICON_NAMES.includes(n));
  const icons = usable.length >= 3 ? usable : ICON_NAMES;

  const rows = ROWS_BY_DIFF[spec.difficulty] ?? 4;
  const cellsPerRow = 6;
  const blanks = spec.difficulty === "hard" ? 2 : 1;
  const top = PAGE.bodyTop + 30;
  const rowH = (PAGE.h - PAGE.margin - top) / rows;
  const cellW = (PAGE.w - 2 * PAGE.margin) / cellsPerRow;
  const size = Math.min(cellW, rowH) * 0.6;

  const draw: string[] = [];
  const answer: string[] = [];
  for (let row = 0; row < rows; row++) {
    const unit = UNITS[rng.int(UNITS.length)];
    const distinct = rng.shuffle(icons).slice(0, Math.max(...unit) + 1);
    const cy = top + row * rowH + rowH / 2;
    for (let c = 0; c < cellsPerRow; c++) {
      const cx = PAGE.margin + c * cellW + cellW / 2;
      const name = distinct[unit[c % unit.length]];
      const blank = c >= cellsPerRow - blanks;
      if (blank) {
        draw.push(
          `<rect x="${f(cx - size / 2)}" y="${f(cy - size / 2)}" width="${f(size)}" height="${f(size)}" rx="10" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6 6"/>`,
        );
        answer.push(drawObject(objects, name, cx, cy, size, 3));
      } else {
        draw.push(drawObject(objects, name, cx, cy, size, 3));
      }
    }
  }

  const body =
    titleBlock(spec.title || "Finish the Pattern", "Draw what comes next in each row.") +
    draw.join("");
  return {
    svg: svgDocument(body),
    solutionSvg: svgDocument(body + answer.join("")),
    meta: { rows },
  };
}
