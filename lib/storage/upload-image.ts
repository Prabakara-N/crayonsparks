import "server-only";

import sharp from "sharp";
import {
  DeleteObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "./r2";
import { getReadUrl } from "./sign-url";

export interface VariantRecord {
  key: string;
  url: string;
  bytes: number;
  width: number;
  height: number;
}

export interface ImageVariants {
  thumb: VariantRecord;
  medium: VariantRecord;
  full: VariantRecord;
}

interface UploadInput {
  /**
   * R2 key prefix for this asset (no leading or trailing slash).
   * Example: `users/abc123/books/book42/pages/p01/v3`
   * The helper appends `/thumb.png`, `/medium.png`, `/full.png`.
   */
  keyPrefix: string;
  /** Raw image bytes from Gemini (PNG, ~2 MB at 1024×1536). */
  buffer: Buffer;
}

// Single full-size variant only. We used to also generate thumb (200px) and
// medium (800px), but that tripled the sharp encodes + R2 uploads per image
// and dominated save time. We now store ONE image and alias thumb/medium to
// it, so every consumer of ImageVariants keeps working (it just serves the
// full image everywhere).
//
// We also intentionally do NOT pass a PNG `quality` here. For PNG, `quality`
// enables libimagequant palette quantization — it shrinks files ~5x but makes
// each encode ~15x slower (~8ms -> ~140ms), which was a big part of slow saves.
// These are line-art / flat-colour pages that stay small losslessly, so we
// keep them lossless and fast.
//
// Width is capped at the 300-DPI 8.5x11 print width (2550px) WITHOUT enlarging,
// so a saved book keeps print resolution for KDP — interior pages render at
// 300 DPI, not the ~120 DPI a 1024px downscale would give.
const FULL_TARGET = { width: 2550 } as const;

/**
 * Encodes a source PNG once (full size) and uploads it to R2 under the given
 * key prefix. Returns the variant struct ready to be stored in Firestore —
 * thumb / medium / full all point to the same uploaded image.
 */
export async function uploadImageVariants({
  keyPrefix,
  buffer,
}: UploadInput): Promise<ImageVariants> {
  const cleaned = keyPrefix.replace(/^\/+|\/+$/g, "");

  const out = await sharp(buffer)
    .resize({ width: FULL_TARGET.width, withoutEnlargement: true })
    .png({ compressionLevel: 6 })
    .toBuffer({ resolveWithObject: true });

  const key = `${cleaned}/full.png`;
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET(),
      Key: key,
      Body: out.data,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const record: VariantRecord = {
    key,
    url: await getReadUrl(key),
    bytes: out.data.byteLength,
    width: out.info.width,
    height: out.info.height,
  };

  return { thumb: record, medium: record, full: record };
}

/**
 * Deletes all three variants of an image. Best-effort batch delete —
 * R2 accepts up to 1000 keys per call. Failures bubble up so the caller
 * (typically the version-prune transaction) can log + continue.
 */
export async function deleteImageVariants(
  variants: ImageVariants,
): Promise<void> {
  await r2.send(
    new DeleteObjectsCommand({
      Bucket: R2_BUCKET(),
      Delete: {
        Objects: [
          { Key: variants.thumb.key },
          { Key: variants.medium.key },
          { Key: variants.full.key },
        ],
      },
    }),
  );
}

/**
 * Convenience helper for the persistence-flow callsites that hold a
 * base64-encoded PNG (e.g. data URLs from Gemini responses).
 */
export async function uploadImageVariantsFromBase64(input: {
  keyPrefix: string;
  base64: string;
}): Promise<ImageVariants> {
  const cleaned = input.base64.startsWith("data:")
    ? input.base64.slice(input.base64.indexOf(",") + 1)
    : input.base64;
  const buffer = Buffer.from(cleaned, "base64");
  return uploadImageVariants({ keyPrefix: input.keyPrefix, buffer });
}
