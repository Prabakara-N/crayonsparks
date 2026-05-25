import "server-only";

import sharp from "sharp";
import type { GenerateImageResult } from "./gemini";

/**
 * Gemini sometimes returns images padded with white/near-white borders
 * instead of edge-to-edge content (especially on portrait crops). Trim those
 * uniform borders so the rendered page is full-bleed.
 *
 * - Threshold ~12 catches near-white (#F3+, JPEG artifacts) without eating
 *   into legitimate light-pastel sky backgrounds.
 * - On any failure (no obvious background, decode error, etc.) returns the
 *   original untouched — never throws.
 */
export async function trimUniformBorders(
  input: GenerateImageResult,
): Promise<GenerateImageResult> {
  try {
    const buffer = Buffer.from(input.data, "base64");
    const trimmed = await sharp(buffer)
      .trim({ background: "white", threshold: 12 })
      .toBuffer();
    if (trimmed.length === 0 || trimmed.length >= buffer.length * 0.99) {
      return input;
    }
    return {
      mimeType: input.mimeType,
      data: trimmed.toString("base64"),
    };
  } catch {
    return input;
  }
}
