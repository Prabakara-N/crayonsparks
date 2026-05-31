"use client";

import {
  fontByKey,
  gridCellRects,
  type BackCoverDesign,
  type GridAspect,
} from "./back-cover-grid-types";

export interface ComposeArgs {
  design: BackCoverDesign;
  imageDataUrls: string[];
  aspect: GridAspect;
}

const CANVAS_WIDTH = 1600;
const MAX_TAGLINE_LINES = 3;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("One of the selected images failed to load."));
    img.src = src;
  });
}

// object-fit: cover — center-crop the source into the destination cell.
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const imgRatio = img.width / img.height;
  const cellRatio = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (imgRatio > cellRatio) {
    sw = img.height * cellRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / cellRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, MAX_TAGLINE_LINES);
}

export async function composeBackCover(args: ComposeArgs): Promise<string> {
  const { design } = args;
  const ratio = args.aspect === "2 / 3" ? 2 / 3 : 3 / 4;
  const width = CANVAS_WIDTH;
  const height = Math.round(width / ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser does not support canvas rendering.");

  ctx.fillStyle = design.bgColor;
  ctx.fillRect(0, 0, width, height);

  const stripeH = design.topStripe.show ? design.topStripe.height * height : 0;
  if (design.topStripe.show) {
    ctx.fillStyle = design.topStripe.color;
    ctx.fillRect(0, 0, width, stripeH);
  }

  if (design.tagline.show && design.tagline.text.trim()) {
    const font = fontByKey(design.tagline.fontKey);
    const fontSize = Math.round(width * 0.042 * design.tagline.fontScale);
    const lineHeight = Math.round(fontSize * 1.3);
    const fontSpec = `${font.italic ? "italic " : ""}${font.weight} ${fontSize}px ${font.cssStack}`;
    const primaryFamily = font.cssStack.split(",")[0].trim();
    if (typeof document !== "undefined" && document.fonts) {
      try {
        await document.fonts.load(
          `${font.italic ? "italic " : ""}${font.weight} ${fontSize}px ${primaryFamily}`,
        );
      } catch {
        // font load best-effort — fall back to the next family in the stack
      }
    }
    ctx.fillStyle = design.tagline.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = fontSpec;
    const lines = wrapLines(ctx, design.tagline.text.trim(), width * design.tagline.width);
    const blockTop =
      design.tagline.y * height - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, design.tagline.x * width, blockTop + i * lineHeight);
    });
  }

  const rects = gridCellRects(design.grid, design.gridSize, width, height);
  const imgs = await Promise.all(
    args.imageDataUrls.slice(0, rects.length).map(loadImage),
  );
  imgs.forEach((img, i) => {
    const r = rects[i];
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    drawCover(ctx, img, r.x, r.y, r.w, r.h);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(3, width * 0.004);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  });

  return canvas.toDataURL("image/png");
}
