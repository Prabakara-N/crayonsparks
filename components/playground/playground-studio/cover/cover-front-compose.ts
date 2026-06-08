import type { FrontTextModel } from "./cover-types";

const CANVAS_W = 1600;

function ratioFromAspect(aspect: string): number {
  const [w, h] = aspect.split("/").map((n) => parseFloat(n.trim()));
  return w && h ? w / h : 3 / 4;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the front cover image."));
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
): void {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

// Composites the generated art + optional title/tagline/author/page-badge into
// a single front-cover PNG data URL at the given trim aspect.
export async function composeFrontCover(
  imageDataUrl: string,
  model: FrontTextModel,
  aspect: string,
): Promise<string> {
  const ratio = ratioFromAspect(aspect);
  const W = CANVAS_W;
  const H = Math.round(W / ratio);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser does not support canvas rendering.");

  const img = await loadImage(imageDataUrl);
  drawCover(ctx, img, W, H);

  const pad = W * 0.07;
  const maxTextW = W - pad * 2;
  ctx.textAlign = "center";

  const hasTitleBlock =
    (model.title.on && model.title.text.trim()) ||
    (model.tagline.on && model.tagline.text.trim());

  if (hasTitleBlock) {
    const titleSize = Math.round(W * 0.1);
    const taglineSize = Math.round(W * 0.045);
    ctx.font = `700 ${titleSize}px Georgia, serif`;
    const titleLines =
      model.title.on && model.title.text.trim()
        ? wrapLines(ctx, model.title.text, maxTextW, 3)
        : [];
    const taglineText =
      model.tagline.on && model.tagline.text.trim() ? model.tagline.text.trim() : "";

    const lineGap = titleSize * 1.12;
    const blockH =
      titleLines.length * lineGap +
      (taglineText ? taglineSize * 1.6 : 0) +
      pad * 0.8;
    const blockTop = model.titlePos === "top" ? pad * 0.6 : H - blockH - pad * 0.6;

    if (model.band) {
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fillRect(0, blockTop - pad * 0.3, W, blockH + pad * 0.6);
    }

    ctx.fillStyle = model.color;
    let y = blockTop + titleSize;
    ctx.font = `700 ${titleSize}px Georgia, serif`;
    for (const ln of titleLines) {
      ctx.fillText(ln, W / 2, y);
      y += lineGap;
    }
    if (taglineText) {
      ctx.font = `500 ${taglineSize}px Georgia, serif`;
      ctx.fillText(taglineText, W / 2, y + taglineSize * 0.4);
    }
  }

  if (model.author.on && model.author.text.trim()) {
    const authorSize = Math.round(W * 0.04);
    ctx.font = `600 ${authorSize}px Georgia, serif`;
    if (model.band) {
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.fillRect(0, H - authorSize * 2.2, W, authorSize * 2.2);
    }
    ctx.fillStyle = model.color;
    ctx.fillText(model.author.text.trim(), W / 2, H - authorSize * 0.8);
  }

  if (model.pages.on && model.pages.text.trim()) {
    const badgeSize = Math.round(W * 0.032);
    ctx.font = `700 ${badgeSize}px Georgia, serif`;
    const label = model.pages.text.trim();
    const tw = ctx.measureText(label).width;
    const bw = tw + badgeSize * 1.6;
    const bh = badgeSize * 2.1;
    const bx = W - bw - pad * 0.5;
    const by = pad * 0.5;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    const r = bh / 2;
    ctx.roundRect(bx, by, bw, bh, r);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(label, bx + bw / 2, by + bh / 2 + badgeSize * 0.05);
    ctx.textBaseline = "alphabetic";
  }

  return canvas.toDataURL("image/png");
}
