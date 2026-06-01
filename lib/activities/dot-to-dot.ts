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

const DEFAULT_POINTS: Record<string, number> = { easy: 12, medium: 20, hard: 30 };

export function generateDotToDot(spec: ActivitySpec): ActivityResult {
  const shapeKey = (spec.params.shape ?? "heart").toLowerCase();
  const shape = SHAPES[shapeKey] ?? SHAPES.heart;
  const count = spec.params.pointCount ?? DEFAULT_POINTS[spec.difficulty] ?? 20;

  const cx = PAGE.w / 2;
  const cy = PAGE.bodyTop + (PAGE.h - PAGE.bodyTop - PAGE.margin) / 2;
  const radius = Math.min(PAGE.w - 2 * PAGE.margin, PAGE.h - PAGE.bodyTop - PAGE.margin) * 0.42;

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const { x, y } = shape(i / count);
    pts.push({ x: cx + x * radius, y: cy + y * radius });
  }

  const dots = pts
    .map((p, i) => {
      const n = i + 1;
      return (
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="#111"/>` +
        `<text x="${(p.x + 9).toFixed(1)}" y="${(p.y - 7).toFixed(1)}" font-family="${SANS}" font-size="20" fill="#111">${n}</text>`
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
