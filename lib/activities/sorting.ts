import type { ActivityResult, ActivitySpec } from "./types";
import { makeRng, specSeed } from "./rng";
import { ICON_NAMES } from "./icons";
import { drawObject, type ObjectAssets } from "./object-draw";
import { PAGE, svgDocument, titleBlock } from "./page";

const ROWS_BY_DIFF: Record<string, number> = { easy: 3, medium: 4, hard: 5 };

const f = (n: number) => n.toFixed(1);

// "Odd one out" — each row shows three of one picture and one different
// picture; the child circles the one that does not belong (early sorting /
// visual discrimination).
export function generateSorting(spec: ActivitySpec, objects?: ObjectAssets): ActivityResult {
  const rng = makeRng(specSeed(spec.params.seed, spec.id));
  const requested = (spec.params.iconNames ?? []).map((n) => n.toLowerCase());
  const usable = objects ? requested : requested.filter((n) => ICON_NAMES.includes(n));
  const pool = usable.length >= 2 ? usable : ICON_NAMES;

  const rows = ROWS_BY_DIFF[spec.difficulty] ?? 4;
  const perRow = 4;
  const top = PAGE.bodyTop + 30;
  const rowH = (PAGE.h - PAGE.margin - top) / rows;
  const cellW = (PAGE.w - 2 * PAGE.margin) / perRow;
  const size = Math.min(cellW, rowH) * 0.55;

  const draw: string[] = [];
  const answer: string[] = [];
  for (let row = 0; row < rows; row++) {
    const shuffled = rng.shuffle(pool);
    const same = shuffled[0];
    const odd = shuffled[1] ?? shuffled[0];
    const oddPos = rng.int(perRow);
    const cy = top + row * rowH + rowH / 2;
    for (let c = 0; c < perRow; c++) {
      const cx = PAGE.margin + c * cellW + cellW / 2;
      draw.push(drawObject(objects, c === oddPos ? odd : same, cx, cy, size, 3));
      if (c === oddPos) {
        answer.push(
          `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(size * 0.72)}" ry="${f(size * 0.72)}" fill="none" stroke="#e11d48" stroke-width="3"/>`,
        );
      }
    }
  }

  const body =
    titleBlock(spec.title || "Which is Different?", "Circle the one that is different in each row.") +
    draw.join("");
  return {
    svg: svgDocument(body),
    solutionSvg: svgDocument(body + answer.join("")),
    meta: { rows },
  };
}
