"use client";

import type { Plan, PromptItem } from "@/components/playground/book-studio/types";
import { getAuthIdToken } from "@/lib/auth/require-auth-for-action";
import { downloadBookZip } from "./download-book-zip";
import type {
  SavedBookForDownload,
  SavedPageForDownload,
} from "./download-saved-book";

async function keyToDataUrl(key: string, idToken: string): Promise<string> {
  const res = await fetch(
    `/api/storage/object?key=${encodeURIComponent(key)}`,
    { headers: { authorization: `Bearer ${idToken}` } },
  );
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image bytes"));
    reader.readAsDataURL(blob);
  });
}

export async function downloadSavedBookZip(
  book: SavedBookForDownload,
  pages: SavedPageForDownload[],
): Promise<void> {
  const idToken = await getAuthIdToken();
  if (!idToken) {
    throw new Error("You must be signed in to download this book.");
  }

  const [coverDataUrl, backCoverDataUrl] = await Promise.all([
    keyToDataUrl(book.cover.full.key, idToken),
    keyToDataUrl(book.backCover.full.key, idToken),
  ]);

  const belongsToDataUrl = book.belongsTo
    ? await keyToDataUrl(book.belongsTo.full.key, idToken)
    : undefined;
  const theEndDataUrl = book.theEndPage
    ? await keyToDataUrl(book.theEndPage.full.key, idToken)
    : undefined;

  const items: PromptItem[] = await Promise.all(
    pages.map(async (p) => ({
      id: p.id,
      name: p.name,
      subject: "",
      status: "done" as const,
      dataUrl: await keyToDataUrl(p.image.full.key, idToken),
      bubbles: p.bubbles,
      bubblesFlattened: p.bubblesFlattened ?? false,
    })),
  );

  const plan = {
    title: book.title,
    coverTitle: book.coverTitle,
  } as Plan;

  await downloadBookZip({
    plan,
    items,
    cover: { status: "done", dataUrl: coverDataUrl },
    backCover: { status: "done", dataUrl: backCoverDataUrl },
    belongsTo: belongsToDataUrl
      ? { status: "done", dataUrl: belongsToDataUrl }
      : { status: "pending" },
    theEndPage: theEndDataUrl
      ? { status: "done", dataUrl: theEndDataUrl }
      : undefined,
    mode: book.mode,
  });
}
