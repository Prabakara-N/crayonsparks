import type { ActivityResult, ActivitySpec } from "./types";
import { hashSeed, makeRng, specSeed } from "./rng";
import { escapeXml, PAGE, SANS, svgDocument, titleBlock } from "./page";

const TRACE = `fill="none" stroke="#9ca3af" stroke-width="3" stroke-dasharray="3 7" stroke-linecap="round" stroke-linejoin="round"`;
const f = (n: number) => n.toFixed(1);

type ShapeDraw = (cx: number, cy: number, r: number) => string;

const GEO_SHAPES: Record<string, ShapeDraw> = {
  circle: (cx, cy, r) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" ${TRACE}/>`,
  square: (cx, cy, r) =>
    `<rect x="${f(cx - r)}" y="${f(cy - r)}" width="${f(r * 2)}" height="${f(r * 2)}" rx="6" ${TRACE}/>`,
  rectangle: (cx, cy, r) =>
    `<rect x="${f(cx - r)}" y="${f(cy - r * 0.65)}" width="${f(r * 2)}" height="${f(r * 1.3)}" rx="6" ${TRACE}/>`,
  triangle: (cx, cy, r) =>
    `<polygon points="${f(cx)},${f(cy - r)} ${f(cx + r)},${f(cy + r)} ${f(cx - r)},${f(cy + r)}" ${TRACE}/>`,
  diamond: (cx, cy, r) =>
    `<polygon points="${f(cx)},${f(cy - r)} ${f(cx + r)},${f(cy)} ${f(cx)},${f(cy + r)} ${f(cx - r)},${f(cy)}" ${TRACE}/>`,
  oval: (cx, cy, r) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(r)}" ry="${f(r * 0.66)}" ${TRACE}/>`,
  star: (cx, cy, r) => {
    const ri = r * 0.42;
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? r : ri;
      pts.push(`${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`);
    }
    return `<polygon points="${pts.join(" ")}" ${TRACE}/>`;
  },
  heart: (cx, cy, r) => {
    const d = `M ${f(cx)} ${f(cy + r * 0.85)} C ${f(cx - r * 1.45)} ${f(cy - r * 0.25)}, ${f(cx - r * 0.55)} ${f(cy - r * 0.95)}, ${f(cx)} ${f(cy - r * 0.3)} C ${f(cx + r * 0.55)} ${f(cy - r * 0.95)}, ${f(cx + r * 1.45)} ${f(cy - r * 0.25)}, ${f(cx)} ${f(cy + r * 0.85)} Z`;
    return `<path d="${d}" ${TRACE}/>`;
  },
  pentagon: (cx, cy, r) => {
    const pts: string[] = [];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      pts.push(`${f(cx + Math.cos(a) * r)},${f(cy + Math.sin(a) * r)}`);
    }
    return `<polygon points="${pts.join(" ")}" ${TRACE}/>`;
  },
};

const SHAPE_ORDER = [
  "circle",
  "square",
  "triangle",
  "rectangle",
  "star",
  "heart",
  "diamond",
  "oval",
  "pentagon",
];
const COUNT_BY_DIFF: Record<string, number> = { easy: 4, medium: 6, hard: 6 };

export function generateShapes(spec: ActivitySpec): ActivityResult {
  // Fold the theme into the seed so different books vary (specSeed alone uses
  // only the page index, which made every book's shapes page identical).
  const rng = makeRng(specSeed(spec.params.seed, spec.id) + hashSeed(spec.theme));
  const requested = (spec.params.shapeNames ?? []).filter((n) => n.toLowerCase() in GEO_SHAPES);
  const list = requested.length ? requested : SHAPE_ORDER;
  const cells = rng.shuffle(list).slice(0, COUNT_BY_DIFF[spec.difficulty] ?? 6);

  const cols = 2;
  const rows = Math.ceil(cells.length / cols);
  const top = PAGE.bodyTop + 30;
  const cellW = (PAGE.w - 2 * PAGE.margin) / cols;
  const cellH = (PAGE.h - PAGE.margin - top) / rows;
  const r = Math.min(cellW, cellH) * 0.28;

  const out: string[] = [];
  cells.forEach((name, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = PAGE.margin + col * cellW + cellW / 2;
    const cy = top + row * cellH + cellH * 0.42;
    out.push((GEO_SHAPES[name.toLowerCase()] ?? GEO_SHAPES.circle)(cx, cy, r));
    out.push(
      `<text x="${f(cx)}" y="${f(top + row * cellH + cellH * 0.86)}" text-anchor="middle" font-family="${SANS}" font-size="26" font-weight="700" fill="#111">${escapeXml(name.toUpperCase())}</text>`,
    );
  });

  const body =
    titleBlock(spec.title || "Trace the Shapes", "Trace each shape. Say its name.") + out.join("");
  return { svg: svgDocument(body), meta: { shapes: cells } };
}
