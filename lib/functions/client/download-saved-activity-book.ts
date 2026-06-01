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
    pageNumbers: true,
    pageBorder: false,
  };

  const interiorPageCount =
    (baseBody.belongsTo ? 2 : 0) +
    1 +
    args.pages.length * 2 +
    (solutionPages.length ? 2 + solutionPages.length * 2 : 0);

  const post = (body: Record<string, unknown>) =>
    fetch("/api/assemble-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  const [coverRes, interiorRes, letterRes, a4Res] = await Promise.all([
    post({
      ...baseBody,
      mode: "cover-wrap",
      interiorPageCount,
      paper: "bw",
      trimWidthInches: 8.5,
      trimHeightInches: 11,
    }),
    post({ ...baseBody, mode: "interior", includeBlankPages: true }),
    post({ ...baseBody, mode: "combined", includeBlankPages: false, trimWidthInches: 8.5, trimHeightInches: 11 }),
    post({ ...baseBody, mode: "combined", includeBlankPages: false, trimWidthInches: 8.27, trimHeightInches: 11.69 }),
  ]);

  for (const [res, label] of [
    [coverRes, "Cover-wrap PDF"],
    [interiorRes, "Interior PDF"],
    [letterRes, "Letter PDF"],
    [a4Res, "A4 PDF"],
  ] as const) {
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || `${label} failed`);
    }
  }

  const [coverBlob, interiorBlob, letterBlob, a4Blob] = await Promise.all([
    coverRes.blob(),
    interiorRes.blob(),
    letterRes.blob(),
    a4Res.blob(),
  ]);

  const { default: JSZip } = await import("jszip");
  const safeName = safeFileName(args.coverTitle, "activity-book");
  const zip = new JSZip();
  zip.file(`${safeName}_cover_KDP.pdf`, await coverBlob.arrayBuffer());
  zip.file(`${safeName}_interior_KDP.pdf`, await interiorBlob.arrayBuffer());
  zip.file(`${safeName}_etsy_letter.pdf`, await letterBlob.arrayBuffer());
  zip.file(`${safeName}_etsy_a4.pdf`, await a4Blob.arrayBuffer());
  zip.file(
    "README.txt",
    [
      "CrayonSparks -> Activity book print package",
      "",
      "  1. *_cover_KDP.pdf     -> KDP COVER section",
      "  2. *_interior_KDP.pdf  -> KDP INTERIOR section (license + activities + answer key)",
      "  3. *_etsy_letter.pdf   -> Etsy/Gumroad, US Letter 8.5x11",
      "  4. *_etsy_a4.pdf       -> Etsy/Gumroad, A4 210x297mm",
    ].join("\n"),
  );

  const zipBytes = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  triggerDownload(zipBytes, `${safeName}_activity_print_package.zip`);
}
