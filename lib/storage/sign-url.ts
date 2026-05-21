import "server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET, R2_PUBLIC_BASE_URL } from "./r2";

const DEFAULT_TTL_SECONDS = 3600; // 1 hour

/**
 * Returns a public read URL for an R2 object.
 *
 * Behavior:
 *   - If R2_PUBLIC_BASE_URL is set (custom domain on a public R2 bucket),
 *     returns a plain unsigned URL — fastest, infinite TTL, public access.
 *   - Otherwise returns a presigned GET URL valid for `ttlSeconds`.
 *
 * Callers (oRPC procedures) should re-sign whenever they fetch the doc
 * from Firestore and the URL is approaching expiry. Cost: ~1ms HMAC
 * computation per re-sign — no R2 round-trip needed.
 */
export async function getReadUrl(
  key: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<string> {
  const publicBase = R2_PUBLIC_BASE_URL();
  if (publicBase) {
    return `${publicBase.replace(/\/+$/, "")}/${encodeKey(key)}`;
  }
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: R2_BUCKET(), Key: key }),
    { expiresIn: ttlSeconds },
  );
}

function encodeKey(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
