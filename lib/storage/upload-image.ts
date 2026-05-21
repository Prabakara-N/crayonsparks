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

const VARIANT_TARGETS = [
  { name: "thumb", width: 200, quality: 80 },
  { name: "medium", width: 800, quality: 85 },
  { name: "full", width: 1024, quality: 95 },
] as const;

/**
 * Resizes a source PNG to thumb / medium / full and uploads all three
 * to R2 under the given key prefix. Returns the variant struct ready
 * to be stored in Firestore.
 *
 * Variant sizes:
 *   thumb   200 px wide  (~50 KB)   — My Books grid + recent activity
 *   medium  800 px wide  (~250 KB)  — BookFlip preview + carousel
 *   full   1024 px wide  (~2 MB)    — Refine modal + PDF assembly
 *
 * The full variant is essentially a passthrough when the source is the
 * native Gemini 1024×1536; sharp normalises any colour profile and
 * strips metadata in the process.
 */
export async function uploadImageVariants({
  keyPrefix,
  buffer,
}: UploadInput): Promise<ImageVariants> {
  const cleaned = keyPrefix.replace(/^\/+|\/+$/g, "");

  const results = await Promise.all(
    VARIANT_TARGETS.map(async (target) => {
      const pipeline = sharp(buffer)
        .resize({ width: target.width, withoutEnlargement: true })
        .png({ quality: target.quality, compressionLevel: 9 });
      const out = await pipeline.toBuffer({ resolveWithObject: true });
      const key = `${cleaned}/${target.name}.png`;
      await r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET(),
          Key: key,
          Body: out.data,
          ContentType: "image/png",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      return {
        name: target.name,
        key,
        bytes: out.data.byteLength,
        width: out.info.width,
        height: out.info.height,
      };
    }),
  );

  const signed = await Promise.all(
    results.map(async (r) => ({ ...r, url: await getReadUrl(r.key) })),
  );

  const find = (name: (typeof VARIANT_TARGETS)[number]["name"]): VariantRecord => {
    const found = signed.find((s) => s.name === name);
    if (!found) {
      throw new Error(`Variant ${name} missing — sharp pipeline failed.`);
    }
    return {
      key: found.key,
      url: found.url,
      bytes: found.bytes,
      width: found.width,
      height: found.height,
    };
  };

  return {
    thumb: find("thumb"),
    medium: find("medium"),
    full: find("full"),
  };
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
