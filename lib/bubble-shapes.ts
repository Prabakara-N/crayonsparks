// Single source of truth for bubble shape SVG paths. Used by:
//   - editor-wide SVG in bubble-editor-main (client preview)
//   - bubble-preview-overlay (read-only thumbnail)
//   - server SVG bake (lib/speech-bubble-svg.ts)
// Pure function. No fs, no DOM.

import type { BubbleShape } from "@/lib/story-bubble-seed";

export interface BubbleVisualGeometry {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  tailTipX: number;
  tailTipY: number;
}

export interface BubbleVisualPaths {
  // Closed path. For speech this includes the tail; for other shapes it is body-only.
  bodyPath: string;
  // White-fill triangle drawn ON TOP of the body to hide its stroke at the joint.
  tailFillPath: string | null;
  // Open V outline of the tail (drawn last, stroke only).
  tailStrokePath: string | null;
  tailDots: Array<{ cx: number; cy: number; r: number }>;
}

function ellipsePath(g: BubbleVisualGeometry): string {
  return `M ${g.cx - g.rx} ${g.cy} A ${g.rx} ${g.ry} 0 1 0 ${g.cx + g.rx} ${g.cy} A ${g.rx} ${g.ry} 0 1 0 ${g.cx - g.rx} ${g.cy} Z`;
}

interface AnchorOnEllipse {
  baseLeftX: number;
  baseLeftY: number;
  baseRightX: number;
  baseRightY: number;
  anchorX: number;
  anchorY: number;
  ndx: number;
  ndy: number;
  len: number;
}

function anchorOnEllipse(
  g: BubbleVisualGeometry,
  halfWidth: number,
): AnchorOnEllipse {
  const dx = g.tailTipX - g.cx;
  const dy = g.tailTipY - g.cy;
  const len = Math.hypot(dx, dy) || 1;
  const ndx = dx / len;
  const ndy = dy / len;
  const denom = Math.hypot(ndx / g.rx, ndy / g.ry) || 1;
  const anchorX = g.cx + ndx / denom;
  const anchorY = g.cy + ndy / denom;
  const px = -ndy * halfWidth;
  const py = ndx * halfWidth;
  return {
    baseLeftX: anchorX + px,
    baseLeftY: anchorY + py,
    baseRightX: anchorX - px,
    baseRightY: anchorY - py,
    anchorX,
    anchorY,
    ndx,
    ndy,
    len,
  };
}

function speechPaths(g: BubbleVisualGeometry): BubbleVisualPaths {
  const dx = g.tailTipX - g.cx;
  const dy = g.tailTipY - g.cy;
  if (dx === 0 && dy === 0) {
    return {
      bodyPath: ellipsePath(g),
      tailFillPath: null,
      tailStrokePath: null,
      tailDots: [],
    };
  }
  const tAnchor = Math.atan2(dy / g.ry, dx / g.rx);
  const localR =
    Math.hypot(g.rx * Math.sin(tAnchor), g.ry * Math.cos(tAnchor)) || 1;
  const halfWidth = Math.max(14, Math.min(g.rx, g.ry) * 0.35);
  const dt = Math.min(Math.PI / 3, halfWidth / localR);
  const tLeft = tAnchor - dt;
  const tRight = tAnchor + dt;
  const baseLeftX = g.cx + g.rx * Math.cos(tLeft);
  const baseLeftY = g.cy + g.ry * Math.sin(tLeft);
  const baseRightX = g.cx + g.rx * Math.cos(tRight);
  const baseRightY = g.cy + g.ry * Math.sin(tRight);
  const bodyPath =
    `M ${baseLeftX} ${baseLeftY} ` +
    `A ${g.rx} ${g.ry} 0 1 0 ${baseRightX} ${baseRightY} ` +
    `L ${g.tailTipX} ${g.tailTipY} ` +
    `Z`;
  return {
    bodyPath,
    tailFillPath: null,
    tailStrokePath: null,
    tailDots: [],
  };
}

function thoughtCloudPath(g: BubbleVisualGeometry): string {
  const lobes = 9;
  const anchorScale = 0.82;
  const bumpScale = 1.22;
  const anchors: Array<{ x: number; y: number; a: number }> = [];
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 - Math.PI / 2;
    anchors.push({
      x: g.cx + Math.cos(a) * g.rx * anchorScale,
      y: g.cy + Math.sin(a) * g.ry * anchorScale,
      a,
    });
  }
  let d = `M ${anchors[0].x} ${anchors[0].y}`;
  for (let i = 0; i < lobes; i++) {
    const cur = anchors[i];
    const next = anchors[(i + 1) % lobes];
    const aMid = cur.a + Math.PI / lobes;
    const bumpX = g.cx + Math.cos(aMid) * g.rx * bumpScale;
    const bumpY = g.cy + Math.sin(aMid) * g.ry * bumpScale;
    d += ` Q ${bumpX} ${bumpY} ${next.x} ${next.y}`;
  }
  d += " Z";
  return d;
}

function thoughtPaths(g: BubbleVisualGeometry): BubbleVisualPaths {
  const t = anchorOnEllipse(g, 0);
  const dotCount = 3;
  const tailDots: BubbleVisualPaths["tailDots"] = [];
  const baseRadius = Math.max(6, Math.min(g.rx, g.ry) * 0.18);
  for (let i = 1; i <= dotCount; i++) {
    const f = 0.18 + 0.72 * (i / (dotCount + 1));
    const r = baseRadius * (1 - i * 0.22);
    tailDots.push({
      cx: t.anchorX + (g.tailTipX - t.anchorX) * f,
      cy: t.anchorY + (g.tailTipY - t.anchorY) * f,
      r: Math.max(3, r),
    });
  }
  return {
    bodyPath: thoughtCloudPath(g),
    tailFillPath: null,
    tailStrokePath: null,
    tailDots,
  };
}

function comicPaths(g: BubbleVisualGeometry): BubbleVisualPaths {
  const cornerR = Math.min(g.rx, g.ry) * 0.32;
  const left = g.cx - g.rx;
  const right = g.cx + g.rx;
  const top = g.cy - g.ry;
  const bottom = g.cy + g.ry;
  const dx = g.tailTipX - g.cx;
  const dy = g.tailTipY - g.cy;
  if (dx === 0 && dy === 0) {
    return {
      bodyPath: narrationRectPath(g),
      tailFillPath: null,
      tailStrokePath: null,
      tailDots: [],
    };
  }
  const halfWidth = Math.max(14, Math.min(g.rx, g.ry) * 0.32);
  const baseCenterX = g.cx + dx * 0.3;
  const minBase = left + cornerR + 4;
  const maxBase = right - cornerR - 4;
  const baseLeftX = Math.max(minBase, baseCenterX - halfWidth);
  const baseRightX = Math.min(maxBase, baseCenterX + halfWidth);
  const safeLeft = Math.min(baseLeftX, baseRightX - 8);
  const safeRight = Math.max(baseRightX, safeLeft + 8);
  const bodyPath =
    `M ${left + cornerR} ${top}` +
    ` H ${right - cornerR}` +
    ` A ${cornerR} ${cornerR} 0 0 1 ${right} ${top + cornerR}` +
    ` V ${bottom - cornerR}` +
    ` A ${cornerR} ${cornerR} 0 0 1 ${right - cornerR} ${bottom}` +
    ` H ${safeRight}` +
    ` L ${g.tailTipX} ${g.tailTipY}` +
    ` L ${safeLeft} ${bottom}` +
    ` H ${left + cornerR}` +
    ` A ${cornerR} ${cornerR} 0 0 1 ${left} ${bottom - cornerR}` +
    ` V ${top + cornerR}` +
    ` A ${cornerR} ${cornerR} 0 0 1 ${left + cornerR} ${top}` +
    ` Z`;
  return {
    bodyPath,
    tailFillPath: null,
    tailStrokePath: null,
    tailDots: [],
  };
}

function narrationRectPath(g: BubbleVisualGeometry): string {
  const r = Math.min(g.rx, g.ry) * 0.18;
  const left = g.cx - g.rx;
  const right = g.cx + g.rx;
  const top = g.cy - g.ry;
  const bottom = g.cy + g.ry;
  return (
    `M ${left + r} ${top}` +
    ` H ${right - r}` +
    ` A ${r} ${r} 0 0 1 ${right} ${top + r}` +
    ` V ${bottom - r}` +
    ` A ${r} ${r} 0 0 1 ${right - r} ${bottom}` +
    ` H ${left + r}` +
    ` A ${r} ${r} 0 0 1 ${left} ${bottom - r}` +
    ` V ${top + r}` +
    ` A ${r} ${r} 0 0 1 ${left + r} ${top}` +
    " Z"
  );
}

function narrationPaths(g: BubbleVisualGeometry): BubbleVisualPaths {
  return {
    bodyPath: narrationRectPath(g),
    tailFillPath: null,
    tailStrokePath: null,
    tailDots: [],
  };
}

export function bubbleVisualPaths(
  shape: BubbleShape | undefined,
  g: BubbleVisualGeometry,
): BubbleVisualPaths {
  switch (shape) {
    case "thought":
      return thoughtPaths(g);
    case "narration":
      return narrationPaths(g);
    case "comic":
      return comicPaths(g);
    case "speech":
    default:
      return speechPaths(g);
  }
}
