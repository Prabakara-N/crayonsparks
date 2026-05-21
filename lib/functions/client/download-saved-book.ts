"use client";

import type { Plan, PromptItem } from "@/components/playground/book-studio/types";
import { getAuthIdToken } from "@/lib/auth/require-auth-for-action";
import { downloadColoringBook } from "./download-coloring-book";
import { downloadStoryBook } from "./download-story-book";

interface ImageVariant {
  key: string;
  url: string;
}
interface ImageVariants {
  thumb: ImageVariant;
  medium: ImageVariant;
  full: ImageVariant;
}

export interface SavedBookForDownload {
  mode: "qa" | "story";
  title: string;
  coverTitle: string;
  belongsToStyle?: "bw" | "color";
  cover: ImageVariants;
  backCover: ImageVariants;
  belongsTo?: ImageVariants;
  theEndPage?: ImageVariants;
}

export interface SavedPageForDownload {
  id: string;
  name: string;
  image: ImageVariants;
}

/**
 * Fetches an R2 object through the same-origin proxy (avoids the CORS
 * block on direct presigned-URL fetches) and converts it to a data URL.
 */
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

/**
 * Re-downloads a previously-saved book as the full KDP print package.
 * Saved books store R2 keys (not base64); this pulls every full-res
 * image through the auth proxy, then hands off to the existing
 * coloring / story download functions.
 */
export async function downloadSavedBook(
  book: SavedBookForDownload,
  pages: SavedPageForDownload[],
): Promise<void> {
  const idToken = await getAuthIdToken();
  if (!idToken) {
    throw new Error("You must be signed in to download this book.");
  }

  const coverDataUrl = await keyToDataUrl(book.cover.full.key, idToken);
  const backCoverDataUrl = await keyToDataUrl(book.backCover.full.key, idToken);

  const pageItems: PromptItem[] = await Promise.all(
    pages.map(async (p) => ({
      id: p.id,
      name: p.name,
      subject: "",
      status: "done" as const,
      dataUrl: await keyToDataUrl(p.image.full.key, idToken),
    })),
  );

  const plan = {
    title: book.title,
    coverTitle: book.coverTitle,
  } as Plan;

  if (book.mode === "story") {
    const theEndDataUrl = book.theEndPage
      ? await keyToDataUrl(book.theEndPage.full.key, idToken)
      : undefined;
    await downloadStoryBook({
      plan,
      items: pageItems,
      cover: { status: "done", dataUrl: coverDataUrl },
      backCover: { status: "done", dataUrl: backCoverDataUrl },
      theEndPage: theEndDataUrl
        ? { status: "done", dataUrl: theEndDataUrl }
        : undefined,
    });
    return;
  }

  const belongsToDataUrl = book.belongsTo
    ? await keyToDataUrl(book.belongsTo.full.key, idToken)
    : undefined;
  await downloadColoringBook({
    plan,
    items: pageItems,
    cover: { status: "done", dataUrl: coverDataUrl },
    backCover: { status: "done", dataUrl: backCoverDataUrl },
    belongsTo: belongsToDataUrl
      ? { status: "done", dataUrl: belongsToDataUrl }
      : { status: "pending" },
    belongsToStyle: book.belongsToStyle ?? "bw",
  });
}
