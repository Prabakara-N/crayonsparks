import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 client (S3-compatible).
 *
 * Env vars (server-only — never expose to browser):
 *   R2_ACCOUNT_ID            Cloudflare dashboard → R2 → Overview
 *   R2_ACCESS_KEY_ID         R2 → Manage R2 API tokens
 *   R2_SECRET_ACCESS_KEY     same dashboard, shown once at token creation
 *   R2_BUCKET                bucket name (created in R2 console)
 *   R2_PUBLIC_BASE_URL       optional custom domain (e.g. https://cdn.crayonsparks.com)
 *                            — when omitted, server-side reads still work,
 *                            and presigned URLs are generated against the
 *                            account endpoint.
 *
 * The whole module is lazy: importing this file does NOT contact R2.
 * First call to `r2` triggers credential validation, after which the
 * client is reused for the process lifetime.
 */

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set — required for Cloudflare R2 storage.`,
    );
  }
  return value;
}

let cachedClient: S3Client | null = null;

function buildClient(): S3Client {
  const accountId = getEnv("R2_ACCOUNT_ID");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: getEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: getEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export const r2: S3Client = new Proxy({} as S3Client, {
  get(_target, prop) {
    if (!cachedClient) cachedClient = buildClient();
    const value = Reflect.get(cachedClient, prop, cachedClient);
    return typeof value === "function" ? value.bind(cachedClient) : value;
  },
});

export const R2_BUCKET = (): string => getEnv("R2_BUCKET");

export const R2_PUBLIC_BASE_URL = (): string | null =>
  process.env.R2_PUBLIC_BASE_URL?.trim() || null;
