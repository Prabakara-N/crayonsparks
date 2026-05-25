"use client";

const DEFAULT_MAX_DIM = 1024;
const DEFAULT_QUALITY = 0.85;

/**
 * Re-encodes a base64 data URL as JPEG ≤maxDim on the longest edge.
 * Used before sending reference images to /api/generate so the request
 * stays under Vercel Hobby's 4.5MB body cap.
 *
 * Returns the original data URL when:
 *  - input is empty / not a data URL
 *  - the browser canvas pipeline fails
 *  - the result would be LARGER than the input (already optimized)
 */
export async function downscaleReferenceImage(
  dataUrl: string | undefined | null,
  opts: { maxDim?: number; quality?: number } = {},
): Promise<string | undefined> {
  if (!dataUrl) return undefined;
  if (typeof window === "undefined") return dataUrl;
  if (!dataUrl.startsWith("data:")) return dataUrl;

  const maxDim = opts.maxDim ?? DEFAULT_MAX_DIM;
  const quality = opts.quality ?? DEFAULT_QUALITY;

  try {
    const img = await loadImage(dataUrl);
    const { width: targetWidth, height: targetHeight } = fitWithin(
      img.naturalWidth,
      img.naturalHeight,
      maxDim,
    );

    if (targetWidth === img.naturalWidth && targetHeight === img.naturalHeight) {
      const isPng = dataUrl.startsWith("data:image/png");
      if (!isPng) return dataUrl;
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const out = canvas.toDataURL("image/jpeg", quality);
    if (!out || out.length >= dataUrl.length) return dataUrl;
    return out;
  } catch {
    return dataUrl;
  }
}

function fitWithin(
  width: number,
  height: number,
  maxDim: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxDim) return { width, height };
  const scale = maxDim / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}
