import "server-only";

import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";

const ALGO = "aes-256-gcm";

export type IntegrationPlatform = "gumroad" | "pinterest" | "etsy";

function encryptionKey(): Buffer {
  const hex = process.env.INTEGRATION_TOKEN_KEY;
  if (!hex) {
    throw new Error("INTEGRATION_TOKEN_KEY is not configured.");
  }
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) {
    throw new Error(
      "INTEGRATION_TOKEN_KEY must be 32 bytes (64 hex chars).",
    );
  }
  return buf;
}

/** AES-256-GCM encrypt → "iv.tag.ciphertext" (all base64). */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, encryptionKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    ct.toString("base64"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, ctB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !ctB64) {
    throw new Error("Malformed encrypted secret.");
  }
  const decipher = crypto.createDecipheriv(
    ALGO,
    encryptionKey(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

interface SaveIntegrationArgs {
  uid: string;
  platform: IntegrationPlatform;
  accessToken: string;
  scopes: string;
  accountId: string | null;
  accountHandle: string | null;
}

export async function saveIntegration(
  args: SaveIntegrationArgs,
): Promise<void> {
  await db
    .collection("users")
    .doc(args.uid)
    .collection("integrations")
    .doc(args.platform)
    .set({
      platform: args.platform,
      accessTokenCiphertext: encryptSecret(args.accessToken),
      scopes: args.scopes,
      accountId: args.accountId,
      accountHandle: args.accountHandle,
      connectedAt: FieldValue.serverTimestamp(),
    });
}

export interface IntegrationStatus {
  platform: IntegrationPlatform;
  connected: boolean;
  accountHandle: string | null;
  connectedAt: number | null;
}

const ALL_PLATFORMS: IntegrationPlatform[] = [
  "gumroad",
  "pinterest",
  "etsy",
];

/** Connection status for every platform — never returns token material. */
export async function listIntegrationStatus(
  uid: string,
): Promise<IntegrationStatus[]> {
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("integrations")
    .get();
  const connected = new Map(snap.docs.map((d) => [d.id, d.data()]));
  return ALL_PLATFORMS.map((platform) => {
    const data = connected.get(platform);
    return {
      platform,
      connected: Boolean(data),
      accountHandle: (data?.accountHandle as string | null) ?? null,
      connectedAt: data?.connectedAt?.toMillis() ?? null,
    };
  });
}

/** Decrypted access token for server-side API calls (publish flow). */
export async function getIntegrationToken(
  uid: string,
  platform: IntegrationPlatform,
): Promise<string | null> {
  const doc = await db
    .collection("users")
    .doc(uid)
    .collection("integrations")
    .doc(platform)
    .get();
  const ciphertext = doc.data()?.accessTokenCiphertext as string | undefined;
  return ciphertext ? decryptSecret(ciphertext) : null;
}

export async function deleteIntegration(
  uid: string,
  platform: IntegrationPlatform,
): Promise<void> {
  await db
    .collection("users")
    .doc(uid)
    .collection("integrations")
    .doc(platform)
    .delete();
}
