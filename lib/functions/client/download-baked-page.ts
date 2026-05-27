"use client";

import { getAuthIdToken } from "@/lib/auth/require-auth-for-action";
import type { StoryBubble } from "@/lib/story-bubble-seed";

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(blob);
  });
}

interface DownloadBakedPageArgs {
  storageKey: string;
  filename: string;
  bubbles: StoryBubble[];
}

export async function downloadBakedPage(
  args: DownloadBakedPageArgs,
): Promise<void> {
  const idToken = await getAuthIdToken();
  if (!idToken) throw new Error("You must be signed in to download.");
  const objectRes = await fetch(
    `/api/storage/object?key=${encodeURIComponent(args.storageKey)}`,
    { headers: { authorization: `Bearer ${idToken}` } },
  );
  if (!objectRes.ok) {
    throw new Error(`Image download failed (${objectRes.status})`);
  }
  const blob = await objectRes.blob();
  const dataUrl = await blobToDataUrl(blob);

  const bakeRes = await fetch("/api/bake-page-bubbles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl: dataUrl, bubbles: args.bubbles }),
  });
  const bakeJson = (await bakeRes.json()) as { dataUrl?: string; error?: string };
  if (!bakeRes.ok || !bakeJson.dataUrl) {
    throw new Error(bakeJson.error || "Bake failed");
  }

  const link = document.createElement("a");
  link.href = bakeJson.dataUrl;
  link.download = args.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
