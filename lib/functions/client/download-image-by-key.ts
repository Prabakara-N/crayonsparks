"use client";

import { getAuthIdToken } from "@/lib/auth/require-auth-for-action";

export async function downloadImageByKey(
  key: string,
  filename: string,
): Promise<void> {
  const idToken = await getAuthIdToken();
  if (!idToken) throw new Error("You must be signed in to download.");
  const res = await fetch(
    `/api/storage/object?key=${encodeURIComponent(key)}`,
    { headers: { authorization: `Bearer ${idToken}` } },
  );
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
