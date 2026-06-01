"use client";

import type { Plan, PromptItem } from "@/components/playground/book-studio/types";
import { safeFileName, triggerDownload } from "./trigger-download";

interface CoverSlice {
  status: "pending" | "generating" | "done" | "error";
  dataUrl?: string;
}

export interface DownloadActivityBookArgs {
  plan: Plan | null;
  items: PromptItem[];
  cover: CoverSlice;
  backCover: CoverSlice;
  belongsTo: CoverSlice;
  belongsToStyle: "bw" | "color";
  includeAnswerKey: boolean;
}

// Builds the full print package for an ACTIVITY BOOK:
//   - cover_KDP.pdf     (cover-wrap, B&W paper sizing)
//   - interior_KDP.pdf  (license + activities + answer key, KDP blanks/gutter)
//   - etsy_letter.pdf   (8.5x11 single PDF, no blanks)
//   - etsy_a4.pdf       (A4 single PDF, no blanks)
//   - README.txt
export async function downloadActivityBook(args: DownloadActivityBookArgs): Promise<void> {
  const done = args.items.filter((i) => i.status === "done" && i.dataUrl);
  if (
    done.length === 0 ||
    args.cover.status !== "done" ||
    !args.cover.dataUrl ||
    args.backCover.status !== "done" ||
    !args.backCover.dataUrl
  ) {
    throw new Error(
      "Front cover, back cover, and at least one activity page are required for the download.",
    );
  }

  const solutionPages = args.includeAnswerKey
    ? done
        .filter((d) => d.solutionDataUrl)
        .map((d) => ({ id: `${d.id}-sol`, name: d.name, dataUrl: d.solutionDataUrl as string }))
    : [];

  const baseBody = {
    title: args.plan?.title,
    category: args.plan?.coverTitle ?? "activity-book",
    cover: { dataUrl: args.cover.dataUrl },
    backCover: { dataUrl: args.backCover.dataUrl },
    belongsTo:
      args.belongsTo.status === "done" && args.belongsTo.dataUrl
        ? { dataUrl: args.belongsTo.dataUrl, style: args.belongsToStyle }
        : undefined,
    pages: done.map((d) => ({ id: d.id, name: d.name, dataUrl: d.dataUrl })),
    solutionPages,
    licensePage: true,
    pageNumbers: true,
    pageBorder: false,
  };

  const interiorPageCount =
    (baseBody.belongsTo ? 2 : 0) +
    1 +
    done.length * 2 +
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
    post({
      ...baseBody,
      mode: "combined",
      includeBlankPages: false,
      trimWidthInches: 8.5,
      trimHeightInches: 11,
    }),
    post({
      ...baseBody,
      mode: "combined",
      includeBlankPages: false,
      trimWidthInches: 8.27,
      trimHeightInches: 11.69,
    }),
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
  const safeName = safeFileName(args.plan?.coverTitle, "activity-book");
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
      "This zip contains 4 PDFs.",
      "",
      "-- AMAZON KDP (paperback) --------------------------------------",
      `  1. ${safeName}_cover_KDP.pdf   -> COVER section`,
      `  2. ${safeName}_interior_KDP.pdf -> INTERIOR / MANUSCRIPT section`,
      "     License page + 'belongs to' + activities + Answer Key at the",
      "     back, with KDP blank pages, gutter margins, and page numbers.",
      "",
      "-- ETSY / GUMROAD (digital download) ---------------------------",
      `  3. ${safeName}_etsy_letter.pdf  -> US Letter (8.5x11 in)`,
      `  4. ${safeName}_etsy_a4.pdf      -> A4 (210x297 mm)`,
      "     Ship BOTH so US and international buyers can print at home.",
      "     No bleed, no blank pages, answer key grouped at the back.",
    ].join("\n"),
  );

  const zipBytes = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  triggerDownload(zipBytes, `${safeName}_activity_print_package.zip`);
}
