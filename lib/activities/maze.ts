import type { ActivityResult, ActivitySpec } from "./types";
import { makeRng, specSeed } from "./rng";
import { PAGE, svgDocument, titleBlock } from "./page";

interface Cell {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
  visited: boolean;
}

const DEFAULT_GRID: Record<string, number> = {
  easy: 9,
  medium: 13,
  hard: 18,
};

function carve(cells: Cell[][], cols: number, rows: number, rng: ReturnType<typeof makeRng>) {
  const stack: [number, number][] = [[0, 0]];
  cells[0][0].visited = true;
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const neighbors: [number, number, keyof Cell, keyof Cell][] = [];
    if (r > 0 && !cells[r - 1][c].visited) neighbors.push([r - 1, c, "top", "bottom"]);
    if (c < cols - 1 && !cells[r][c + 1].visited) neighbors.push([r, c + 1, "right", "left"]);
    if (r < rows - 1 && !cells[r + 1][c].visited) neighbors.push([r + 1, c, "bottom", "top"]);
    if (c > 0 && !cells[r][c - 1].visited) neighbors.push([r, c - 1, "left", "right"]);
    if (!neighbors.length) {
      stack.pop();
      continue;
    }
    const [nr, nc, wall, opposite] = neighbors[rng.int(neighbors.length)];
    cells[r][c][wall] = false;
    cells[nr][nc][opposite] = false;
    cells[nr][nc].visited = true;
    stack.push([nr, nc]);
  }
}

function solve(cells: Cell[][], cols: number, rows: number): [number, number][] {
  const key = (r: number, c: number) => r * cols + c;
  const prev = new Map<number, number>();
  const queue: [number, number][] = [[0, 0]];
  const seen = new Set<number>([key(0, 0)]);
  while (queue.length) {
    const [r, c] = queue.shift()!;
    if (r === rows - 1 && c === cols - 1) break;
    const cell = cells[r][c];
    const moves: [number, number][] = [];
    if (!cell.top && r > 0) moves.push([r - 1, c]);
    if (!cell.right && c < cols - 1) moves.push([r, c + 1]);
    if (!cell.bottom && r < rows - 1) moves.push([r + 1, c]);
    if (!cell.left && c > 0) moves.push([r, c - 1]);
    for (const [mr, mc] of moves) {
      if (seen.has(key(mr, mc))) continue;
      seen.add(key(mr, mc));
      prev.set(key(mr, mc), key(r, c));
      queue.push([mr, mc]);
    }
  }
  const path: [number, number][] = [];
  let cur = key(rows - 1, cols - 1);
  path.push([rows - 1, cols - 1]);
  while (prev.has(cur)) {
    cur = prev.get(cur)!;
    path.push([Math.floor(cur / cols), cur % cols]);
  }
  return path.reverse();
}

function renderWalls(cells: Cell[][], cols: number, rows: number, ox: number, oy: number, cs: number): string {
  const lines: string[] = [];
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ox + c * cs;
      const y = oy + r * cs;
      const cell = cells[r][c];
      if (cell.top) line(x, y, x + cs, y);
      if (cell.left) line(x, y, x, y + cs);
      if (c === cols - 1 && cell.right) line(x + cs, y, x + cs, y + cs);
      if (r === rows - 1 && cell.bottom) line(x, y + cs, x + cs, y + cs);
    }
  }
  return `<g stroke="#111111" stroke-width="4" stroke-linecap="square">${lines.join("")}</g>`;
}

export function generateMaze(spec: ActivitySpec): ActivityResult {
  const cols = spec.params.gridSize ?? DEFAULT_GRID[spec.difficulty] ?? 12;
  const rows = cols;
  const rng = makeRng(specSeed(spec.params.seed, spec.id));

  const cells: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      top: true,
      right: true,
      bottom: true,
      left: true,
      visited: false,
    })),
  );
  carve(cells, cols, rows, rng);
  const path = solve(cells, cols, rows);

  cells[0][0].top = false;
  cells[rows - 1][cols - 1].bottom = false;

  const avail = Math.min(PAGE.w - 2 * PAGE.margin, PAGE.h - PAGE.bodyTop - PAGE.margin);
  const cs = Math.floor(avail / Math.max(cols, rows));
  const gridW = cs * cols;
  const gridH = cs * rows;
  const ox = (PAGE.w - gridW) / 2;
  const oy = PAGE.bodyTop + (PAGE.h - PAGE.bodyTop - PAGE.margin - gridH) / 2;

  const walls = renderWalls(cells, cols, rows, ox, oy, cs);
  const start = `<text x="${ox}" y="${oy - 10}" font-family="sans-serif" font-size="22" fill="#111">Start</text>`;
  const finish = `<text x="${ox + gridW}" y="${oy + gridH + 28}" text-anchor="end" font-family="sans-serif" font-size="22" fill="#111">End</text>`;
  const body = titleBlock(spec.title || "Maze", "Find your way from Start to End.") + walls + start + finish;

  const pathPts = path
    .map(([r, c]) => `${ox + c * cs + cs / 2},${oy + r * cs + cs / 2}`)
    .join(" ");
  const solutionLine = `<polyline points="${ox + cs / 2},${oy - cs / 2} ${pathPts} ${ox + gridW - cs / 2},${oy + gridH + cs / 2}" fill="none" stroke="#e11d48" stroke-width="${Math.max(3, cs * 0.18)}" stroke-linecap="round" stroke-linejoin="round"/>`;

  return {
    svg: svgDocument(body),
    solutionSvg: svgDocument(body + solutionLine),
    meta: { cols, rows, solutionLength: path.length },
  };
}
