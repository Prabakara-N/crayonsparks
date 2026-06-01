import type { ActivityResult, ActivitySpec } from "./types";
import { PAGE, SANS, svgDocument, titleBlock } from "./page";

type ShapeFn = (t: number) => { x: number; y: number };

const SHAPES: Record<string, ShapeFn> = {
  heart: (t) => {
    const a = t * Math.PI * 2;
    return {
      x: 16 * Math.sin(a) ** 3 / 16,
      y: -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16,
    };
  },
  star: (t) => {
    const a = t * Math.PI * 2 - Math.PI / 2;
    const k = 5;
    const r = 0.5 + 0.5 * Math.abs(Math.cos(k * (a / 2)));
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  },
  flower: (t) => {
    const a = t * Math.PI * 2;
    const r = Math.cos(5 * a) * 0.4 + 0.6;
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  },
  circle: (t) => {
    const a = t * Math.PI * 2;
    return { x: Math.cos(a), y: Math.sin(a) };
  },
};

const DEFAULT_POINTS: Record<string, number> = { easy: 10, medium: 16, hard: 24 };

// Resample the parametric shape at `count` points spaced evenly by arc length,
// so points never bunch at cusps/tips (the cause of overlapping labels).
function evenPoints(shape: ShapeFn, count: number): { x: number; y: number }[] {
  const SAMPLES = 720;
  const raw: { x: number; y: number }[] = [];
  for (let i = 0; i <= SAMPLES; i++) raw.push(shape(i / SAMPLES));
  const cum = [0];
  for (let i = 1; i < raw.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y));
  }
  const total = cum[cum.length - 1];
  const out: { x: number; y: number }[] = [];
  for (let n = 0; n < count; n++) {
    const target = (n / count) * total;
    let i = 1;
    while (i < cum.length && cum[i] < target) i++;
    out.push(raw[Math.min(i, raw.length - 1)]);
  }
  return out;
}

export function generateDotToDot(spec: ActivitySpec): ActivityResult {
  const shapeKey = (spec.params.shape ?? "heart").toLowerCase();
  const shape = SHAPES[shapeKey] ?? SHAPES.heart;
  const count = spec.params.pointCount ?? DEFAULT_POINTS[spec.difficulty] ?? 16;

  const cx = PAGE.w / 2;
  const cy = PAGE.bodyTop + (PAGE.h - PAGE.bodyTop - PAGE.margin) / 2;
  const radius = Math.min(PAGE.w - 2 * PAGE.margin, PAGE.h - PAGE.bodyTop - PAGE.margin) * 0.4;

  const unit = evenPoints(shape, count);
  const pts = unit.map((p) => ({ x: cx + p.x * radius, y: cy + p.y * radius }));
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;

  const dots = pts
    .map((p, i) => {
      const n = i + 1;
      const dx = p.x - mx;
      const dy = p.y - my;
      const len = Math.hypot(dx, dy) || 1;
      const lx = p.x + (dx / len) * 18;
      const ly = p.y + (dy / len) * 18 + 6;
      return (
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#111"/>` +
        `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-family="${SANS}" font-size="17" fill="#111">${n}</text>`
      );
    })
    .join("");

  const body =
    titleBlock(spec.title || "Connect the Dots", "Connect the dots from 1 to the end.") + dots;

  const linePts = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const solution = `<polyline points="${linePts} ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}" fill="none" stroke="#e11d48" stroke-width="2.5"/>`;

  return {
    svg: svgDocument(body),
    solutionSvg: svgDocument(body + solution),
    meta: { shape: shapeKey, points: count },
  };
}
