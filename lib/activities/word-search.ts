import type { ActivityResult, ActivitySpec } from "./types";
import { makeRng, specSeed, type Rng } from "./rng";
import { escapeXml, PAGE, SANS, svgDocument, titleBlock } from "./page";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [1, -1],
];

const DEFAULT_GRID: Record<string, number> = { easy: 10, medium: 13, hard: 15 };

interface Placement {
  word: string;
  r: number;
  c: number;
  dr: number;
  dc: number;
}

function cleanWords(words: string[]): string[] {
  return words
    .map((w) => w.toUpperCase().replace(/[^A-Z]/g, ""))
    .filter((w) => w.length >= 2)
    .slice(0, 18);
}

function tryFill(words: string[], n: number, rng: Rng): { grid: string[][]; placements: Placement[] } | null {
  const grid: string[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => ""));
  const placements: Placement[] = [];
  for (const word of words) {
    let placed = false;
    for (let attempt = 0; attempt < 300 && !placed; attempt++) {
      const [dr, dc] = rng.pick(DIRS);
      const r = rng.int(n);
      const c = rng.int(n);
      const endR = r + dr * (word.length - 1);
      const endC = c + dc * (word.length - 1);
      if (endR < 0 || endR >= n || endC < 0 || endC >= n) continue;
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const cell = grid[r + dr * i][c + dc * i];
        if (cell !== "" && cell !== word[i]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (let i = 0; i < word.length; i++) grid[r + dr * i][c + dc * i] = word[i];
      placements.push({ word, r, c, dr, dc });
      placed = true;
    }
    if (!placed) return null;
  }
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (grid[r][c] === "") grid[r][c] = LETTERS[rng.int(26)];
  return { grid, placements };
}

export function generateWordSearch(spec: ActivitySpec): ActivityResult {
  const words = cleanWords(spec.params.words ?? []);
  const longest = words.reduce((m, w) => Math.max(m, w.length), 4);
  const baseN = Math.max(DEFAULT_GRID[spec.difficulty] ?? 12, longest + 1);
  const seed = specSeed(spec.params.seed, spec.id);

  let result: { grid: string[][]; placements: Placement[] } | null = null;
  let n = baseN;
  for (let bump = 0; bump <= 4 && !result; bump++) {
    for (let t = 0; t < 12 && !result; t++) {
      result = tryFill(words, n, makeRng(seed + bump * 100 + t));
    }
    if (!result) n += 2;
  }
  if (!result) {
    n = baseN + 6;
    result = tryFill(words, n, makeRng(seed)) ?? { grid: Array.from({ length: n }, () => Array.from({ length: n }, () => LETTERS[0])), placements: [] };
  }

  const { grid, placements } = result;
  const placedWords = new Set(placements.map((p) => p.word));

  const contentW = PAGE.w - 2 * PAGE.margin;
  const gridAreaH = (PAGE.h - PAGE.bodyTop - PAGE.margin) * 0.7;
  const cs = Math.floor(Math.min(contentW / n, gridAreaH / n));
  const gridW = cs * n;
  const ox = (PAGE.w - gridW) / 2;
  const oy = PAGE.bodyTop;

  const cells: string[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      cells.push(
        `<text x="${ox + c * cs + cs / 2}" y="${oy + r * cs + cs / 2 + cs * 0.32}" text-anchor="middle" font-family="${SANS}" font-size="${cs * 0.6}" fill="#111">${grid[r][c]}</text>`,
      );
  const gridBox = `<rect x="${ox}" y="${oy}" width="${gridW}" height="${gridW}" fill="none" stroke="#bbb" stroke-width="1.5"/>`;

  const visibleWords = words.filter((w) => placedWords.has(w));
  const listTop = oy + gridW + 50;
  const cols = visibleWords.length > 8 ? 3 : 2;
  const colW = contentW / cols;
  const listItems = visibleWords
    .map((w, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = PAGE.margin + col * colW + 16;
      const y = listTop + row * 34;
      return `<text x="${x}" y="${y}" font-family="${SANS}" font-size="22" fill="#222">• ${escapeXml(w)}</text>`;
    })
    .join("");

  const body =
    titleBlock(spec.title || "Word Search", "Find every word hidden in the grid.") +
    gridBox +
    cells.join("") +
    listItems;

  const highlights = placements
    .map((p) => {
      const x1 = ox + p.c * cs + cs / 2;
      const y1 = oy + p.r * cs + cs / 2;
      const x2 = ox + (p.c + p.dc * (p.word.length - 1)) * cs + cs / 2;
      const y2 = oy + (p.r + p.dr * (p.word.length - 1)) * cs + cs / 2;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e11d48" stroke-width="${cs * 0.78}" stroke-linecap="round" opacity="0.32"/>`;
    })
    .join("");

  return {
    svg: svgDocument(body),
    solutionSvg: svgDocument(body + highlights),
    meta: {
      gridSize: n,
      placed: placements.map((p) => p.word),
      unplaced: words.filter((w) => !placedWords.has(w)),
    },
  };
}
