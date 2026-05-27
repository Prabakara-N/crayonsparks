// Composites the SVG bubble overlay onto a story page PNG. Called at
// export time (single-page download, PDF assembly), not generation time —
// the page is stored bubble-free so the editor can re-position bubbles
// at any point.

import sharp from "sharp";
import { renderBubblesSvg } from "@/lib/speech-bubble-svg";
import type { StoryBubble } from "@/lib/story-bubble-seed";

export interface CompositeBubblesInput {
  imageBase64: string;
  bubbles: StoryBubble[];
}

export interface CompositeBubblesResult {
  base64: string;
  mimeType: "image/png";
}

export async function compositeBubblesOnImage(
  input: CompositeBubblesInput,
): Promise<CompositeBubblesResult> {
  const buffer = Buffer.from(input.imageBase64, "base64");
  const baseImage = sharp(buffer);
  const meta = await baseImage.metadata();
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1536;

  const svg = renderBubblesSvg({
    bubbles: input.bubbles,
    pageWidth: width,
    pageHeight: height,
  });
  if (!svg) {
    const passthrough = await baseImage.png().toBuffer();
    return { base64: passthrough.toString("base64"), mimeType: "image/png" };
  }

  const composited = await baseImage
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  return { base64: composited.toString("base64"), mimeType: "image/png" };
}
