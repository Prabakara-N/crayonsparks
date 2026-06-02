"use client";

import { safeFileName, triggerDownload } from "./trigger-download";

export interface SavedActivityPage {
  id: string;
  name: string;
  imageUrl: string;
  solutionUrl?: string;
}

export interface DownloadSavedActivityBookArgs {
  title?: string;
  coverTitle?: string;
  coverUrl?: string;
  backCoverUrl?: string;
  belongsToUrl?: string;
  belongsToStyle?: "bw" | "color";
  pages: SavedActivityPage[];
  includeAnswerKey: boolean;
}

// Saved-library variant of the activity print package: image inputs are R2
// URLs (resolved server-side by /api/assemble-pdf), not in-browser data URLs.
export async function downloadSavedActivityBook(
  args: DownloadSavedActivityBookArgs,
  target: "kdp" | "etsy" = "kdp",
): Promise<void> {
  if (!args.pages.length || !args.coverUrl || !args.backCoverUrl) {
    throw new Error("This book is missing a cover, back cover, or pages.");
  }

  const solutionPages = args.includeAnswerKey
    ? args.pages
        .filter((p) => p.solutionUrl)
        .map((p) => ({ id: `${p.id}-sol`, name: p.name, url: p.solutionUrl as string }))
    : [];

  const baseBody = {
    title: args.title,
    category: args.coverTitle ?? "activity-book",
    cover: { url: args.coverUrl },
    backCover: { url: args.backCoverUrl },
    belongsTo: args.belongsToUrl
      ? { url: args.belongsToUrl, style: args.belongsToStyle ?? "bw" }
      : undefined,
    pages: args.pages.map((p) => ({ id: p.id, name: p.name, url: p.imageUrl })),
    solutionPages,
    licensePage: true,
    pageBorder: false,
    paper: "bw",
  };

  // One request → the server fetches each R2 image once and builds all 4 PDFs,
  // returning the zip. Avoids re-fetching every image 4 times.
  const res = await fetch("/api/assemble-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...baseBody, mode: "package", target }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "Print package build failed");
  }
  const safeName = safeFileName(args.coverTitle, "activity-book");
  triggerDownload(await res.blob(), `${safeName}_${target}_package.zip`);
}
