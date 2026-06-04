import "server-only";

import sharp from "sharp";

export interface OutlinePoint {
  x: number;
  y: number;
}

// Turns an AI-drawn solid silhouette into an ordered ring of connect-the-dots
// points: threshold to black/white, Moore-neighbor boundary trace, resample by
// arc length, normalize to [-1,1]. Returns [] if no clean shape is found (the
// caller then falls back to a parametric/curated outline).
export async function traceOutlineToPoints(
  dataUrl: string,
  pointCount = 16,
): Promise<OutlinePoint[]> {
  const base64 = dataUrl.split(",")[1] ?? "";
  if (!base64) return [];
  const buf = Buffer.from(base64, "base64");
  const SIZE = 240;
  const { data, info } = await sharp(buf)
    .resize(SIZE, SIZE, { fit: "contain", background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .median(3)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const dark = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < W && y < H && data[y * W + x] < 128;

  let sx = -1;
  let sy = -1;
  scan: for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (dark(x, y)) {
        sx = x;
        sy = y;
        break scan;
      }
    }
  }
  if (sx < 0) return [];

  const dirs = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];
  const boundary: [number, number][] = [];
  let cx = sx;
  let cy = sy;
  let backIdx = 4;
  const maxSteps = W * H * 4;
  let steps = 0;
  do {
    boundary.push([cx, cy]);
    let found = false;
    for (let i = 0; i < 8; i++) {
      const d = (backIdx + 1 + i) % 8;
      const nx = cx + dirs[d][0];
      const ny = cy + dirs[d][1];
      if (dark(nx, ny)) {
        backIdx = (d + 4) % 8;
        cx = nx;
        cy = ny;
        found = true;
        break;
      }
    }
    if (!found) break;
    steps += 1;
  } while ((cx !== sx || cy !== sy) && steps < maxSteps);

  // A real shape's outline should be a sizeable fraction of the canvas.
  if (boundary.length < (W + H) / 2) return [];

  const cum = [0];
  for (let i = 1; i < boundary.length; i++) {
    const dx = boundary[i][0] - boundary[i - 1][0];
    const dy = boundary[i][1] - boundary[i - 1][1];
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  const total = cum[cum.length - 1];
  if (total <= 0) return [];

  const sampled: OutlinePoint[] = [];
  for (let k = 0; k < pointCount; k++) {
    const target = (k / pointCount) * total;
    let i = 1;
    while (i < cum.length && cum[i] < target) i += 1;
    const [px, py] = boundary[Math.min(i, boundary.length - 1)];
    sampled.push({ x: px, y: py });
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of sampled) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const half = Math.max(maxX - minX, maxY - minY) / 2 || 1;
  return sampled.map((p) => ({ x: (p.x - midX) / half, y: (p.y - midY) / half }));
}
