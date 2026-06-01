import "server-only";

import { R2_PUBLIC_BASE_URL } from "./r2";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

// SSRF guard: only our own R2 storage hosts may be fetched server-side.
function isAllowedHost(host: string): boolean {
  if (host.endsWith(".r2.cloudflarestorage.com")) return true;
  const base = R2_PUBLIC_BASE_URL();
  if (base) {
    try {
      if (new URL(base).hostname === host) return true;
    } catch {
      // ignore malformed base
    }
  }
  return false;
}

// Fetches an image from a trusted R2 read URL and returns a base64 data URL.
// Rejects any non-https or non-allowlisted host to prevent SSRF.
export async function fetchImageAsDataUrl(rawUrl: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid image URL.");
  }
  if (url.protocol !== "https:") throw new Error("Only https image URLs are allowed.");
  if (!isAllowedHost(url.hostname)) throw new Error("Image host is not allowed.");

  const res = await fetch(url, { redirect: "error" });
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status}).`);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) throw new Error("URL did not return an image.");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES) throw new Error("Image is too large.");
  return `data:${contentType};base64,${buf.toString("base64")}`;
}
