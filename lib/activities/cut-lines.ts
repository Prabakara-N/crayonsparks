import type { ActivityResult, ActivitySpec } from "./types";
import { PAGE, SANS, svgDocument, titleBlock } from "./page";

function linePath(style: string, x1: number, x2: number, y: number): string {
  if (style === "zigzag") {
    const pts: string[] = [];
    const step = 40;
    let up = true;
    for (let x = x1; x <= x2; x += step) {
      pts.push(`${x},${(y + (up ? -18 : 18)).toFixed(1)}`);
      up = !up;
    }
    return `<polyline points="${pts.join(" ")}" fill="none" stroke="#111" stroke-width="2.5" stroke-dasharray="10 7"/>`;
  }
  if (style === "curved") {
    let d = `M ${x1} ${y}`;
    const step = 80;
    let up = true;
    for (let x = x1; x < x2; x += step) {
      d += ` Q ${x + step / 2} ${y + (up ? -34 : 34)} ${x + step} ${y}`;
      up = !up;
    }
    return `<path d="${d}" fill="none" stroke="#111" stroke-width="2.5" stroke-dasharray="10 7"/>`;
  }
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#111" stroke-width="2.5" stroke-dasharray="10 7"/>`;
}

export function generateCutLines(spec: ActivitySpec): ActivityResult {
  const style = spec.params.lineStyle ?? "straight";
  const rows = spec.difficulty === "hard" ? 7 : spec.difficulty === "easy" ? 5 : 6;
  const x1 = PAGE.margin + 60;
  const x2 = PAGE.w - PAGE.margin;
  const top = PAGE.bodyTop + 30;
  const gap = (PAGE.h - PAGE.margin - top) / rows;

  const lines: string[] = [];
  for (let i = 0; i < rows; i++) {
    const y = top + gap * i + gap / 2;
    lines.push(
      `<text x="${PAGE.margin}" y="${y + 8}" font-family="${SANS}" font-size="26">✂</text>`,
    );
    lines.push(linePath(style, x1, x2, y));
  }

  const body =
    titleBlock(spec.title || "Cut the Lines", "Cut along the dashed lines.") + lines.join("");
  return { svg: svgDocument(body), meta: { style, rows } };
}
