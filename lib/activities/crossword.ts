import type { ActivityResult, ActivitySpec } from "./types";
import { makeRng, specSeed } from "./rng";
import { escapeXml, PAGE, SANS, svgDocument, titleBlock } from "./page";

type Dir = "A" | "D";
interface Placement {
  answer: string;
  clue: string;
  r: number;
  c: number;
  dir: Dir;
  number?: number;
}

const DEFAULT_CLUES = [
  { answer: "CAT", clue: "A furry pet that says meow" },
  { answer: "DOG", clue: "A pet that barks" },
  { answer: "SUN", clue: "It shines in the sky by day" },
  { answer: "STAR", clue: "It twinkles at night" },
  { answer: "TREE", clue: "It has leaves and branches" },
  { answer: "FISH", clue: "It swims in water" },
];

function key(r: number, c: number): string {
  return `${r},${c}`;
}

function canPlace(grid: Map<string, string>, word: string, r: number, c: number, dir: Dir, requireCross: boolean): boolean {
  const dr = dir === "D" ? 1 : 0;
  const dc = dir === "A" ? 1 : 0;
  if (grid.has(key(r - dr, c - dc))) return false;
  if (grid.has(key(r + dr * word.length, c + dc * word.length))) return false;
  let crosses = 0;
  for (let i = 0; i < word.length; i++) {
    const rr = r + dr * i;
    const cc = c + dc * i;
    const existing = grid.get(key(rr, cc));
    if (existing) {
      if (existing !== word[i]) return false;
      crosses++;
    } else {
      const sideA = grid.get(key(rr + dc, cc + dr));
      const sideB = grid.get(key(rr - dc, cc - dr));
      if (sideA || sideB) return false;
    }
  }
  return requireCross ? crosses > 0 : true;
}

function place(grid: Map<string, string>, p: Placement) {
  const dr = p.dir === "D" ? 1 : 0;
  const dc = p.dir === "A" ? 1 : 0;
  for (let i = 0; i < p.answer.length; i++) grid.set(key(p.r + dr * i, p.c + dc * i), p.answer[i]);
}

export function generateCrossword(spec: ActivitySpec): ActivityResult {
  const raw = (spec.params.clues?.length ? spec.params.clues : DEFAULT_CLUES)
    .map((c) => ({ answer: c.answer.toUpperCase().replace(/[^A-Z]/g, ""), clue: c.clue }))
    .filter((c) => c.answer.length >= 2)
    .slice(0, 12)
    .sort((a, b) => b.answer.length - a.answer.length);

  function buildLayout(entries: { answer: string; clue: string }[]): {
    grid: Map<string, string>;
    placements: Placement[];
    unplaced: string[];
  } {
    const grid = new Map<string, string>();
    const placements: Placement[] = [];
    const unplaced: string[] = [];
    entries.forEach((entry, idx) => {
      if (idx === 0) {
        const p: Placement = { ...entry, r: 0, c: 0, dir: "A" };
        place(grid, p);
        placements.push(p);
        return;
      }
      let done = false;
      for (const placed of placements) {
        const pdr = placed.dir === "D" ? 1 : 0;
        const pdc = placed.dir === "A" ? 1 : 0;
        for (let pi = 0; pi < placed.answer.length && !done; pi++) {
          for (let wi = 0; wi < entry.answer.length && !done; wi++) {
            if (placed.answer[pi] !== entry.answer[wi]) continue;
            const cellR = placed.r + pdr * pi;
            const cellC = placed.c + pdc * pi;
            const dir: Dir = placed.dir === "A" ? "D" : "A";
            const r = dir === "D" ? cellR - wi : cellR;
            const c = dir === "A" ? cellC - wi : cellC;
            if (canPlace(grid, entry.answer, r, c, dir, true)) {
              place(grid, { ...entry, r, c, dir });
              placements.push({ ...entry, r, c, dir });
              done = true;
            }
          }
        }
        if (done) break;
      }
      if (!done) unplaced.push(entry.answer);
    });
    return { grid, placements, unplaced };
  }

  const rng = makeRng(specSeed(spec.params.seed, spec.id));
  let best = buildLayout(raw);
  for (let t = 0; t < 40 && best.unplaced.length > 0; t++) {
    const candidate = buildLayout(rng.shuffle(raw));
    if (candidate.unplaced.length < best.unplaced.length) best = candidate;
  }
  const { grid, placements, unplaced } = best;

  let minR = Infinity;
  let minC = Infinity;
  let maxR = -Infinity;
  let maxC = -Infinity;
  for (const k of grid.keys()) {
    const [r, c] = k.split(",").map(Number);
    minR = Math.min(minR, r);
    minC = Math.min(minC, c);
    maxR = Math.max(maxR, r);
    maxC = Math.max(maxC, c);
  }
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;

  const startCells = placements
    .map((p) => ({ r: p.r - minR, c: p.c - minC, p }))
    .sort((a, b) => a.r - b.r || a.c - b.c);
  const numberAt = new Map<string, number>();
  let counter = 0;
  for (const s of startCells) {
    const k = key(s.r, s.c);
    if (!numberAt.has(k)) {
      counter++;
      numberAt.set(k, counter);
    }
    s.p.number = numberAt.get(k);
  }

  const gridAreaH = (PAGE.h - PAGE.bodyTop - PAGE.margin) * 0.55;
  const cs = Math.floor(Math.min((PAGE.w - 2 * PAGE.margin) / cols, gridAreaH / rows));
  const gridW = cs * cols;
  const ox = (PAGE.w - gridW) / 2;
  const oy = PAGE.bodyTop;

  const cellSvgs: string[] = [];
  const numberSvgs: string[] = [];
  const letterSvgs: string[] = [];
  for (const k of grid.keys()) {
    const [r, c] = k.split(",").map(Number);
    const x = ox + (c - minC) * cs;
    const y = oy + (r - minR) * cs;
    cellSvgs.push(`<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="#fff" stroke="#111" stroke-width="1.5"/>`);
    const num = numberAt.get(key(r - minR, c - minC));
    if (num)
      numberSvgs.push(`<text x="${x + 3}" y="${y + 14}" font-family="${SANS}" font-size="${cs * 0.28}" fill="#111">${num}</text>`);
    letterSvgs.push(`<text x="${x + cs / 2}" y="${y + cs * 0.72}" text-anchor="middle" font-family="${SANS}" font-size="${cs * 0.6}" fill="#111">${grid.get(k)}</text>`);
  }

  const across = placements.filter((p) => p.dir === "A").sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  const down = placements.filter((p) => p.dir === "D").sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  const clueTop = oy + rows * cs + 50;
  const colW = (PAGE.w - 2 * PAGE.margin) / 2;
  const clueList = (items: Placement[], heading: string, x: number): string => {
    const parts = [`<text x="${x}" y="${clueTop}" font-family="${SANS}" font-size="22" font-weight="700" fill="#111">${escapeXml(heading)}</text>`];
    items.forEach((p, i) => {
      parts.push(
        `<text x="${x}" y="${clueTop + 30 + i * 26}" font-family="${SANS}" font-size="17" fill="#222">${p.number}. ${escapeXml(p.clue)}</text>`,
      );
    });
    return parts.join("");
  };

  const body =
    titleBlock(spec.title || "Crossword", "Solve the clues to fill the grid.") +
    cellSvgs.join("") +
    numberSvgs.join("") +
    clueList(across, "Across", PAGE.margin) +
    clueList(down, "Down", PAGE.margin + colW);

  return {
    svg: svgDocument(body),
    solutionSvg: svgDocument(body + letterSvgs.join("")),
    meta: { placed: placements.map((p) => p.answer), unplaced, rows, cols },
  };
}
