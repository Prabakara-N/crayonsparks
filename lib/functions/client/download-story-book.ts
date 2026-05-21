"use client";

import type { Plan, PromptItem } from "@/components/playground/book-studio/types";
import { safeFileName, triggerDownload } from "./trigger-download";

interface CoverSlice {
  status: "pending" | "generating" | "done" | "error";
  dataUrl?: string;
}

export interface DownloadStoryBookArgs {
  plan: Plan | null;
  items: PromptItem[];
  cover: CoverSlice;
  backCover: CoverSlice;
  theEndPage?: CoverSlice;
}

/**
 * Builds the full KDP print package for a STORY BOOK:
 *   - cover_KDP.pdf       (cover-wrap, color paperback sizing)
 *   - interior_KDP.pdf    (interior, full-bleed, no blank pages)
 *   - etsy_a4.pdf         (single A4 PDF for Etsy / Gumroad)
 *   - README.txt          (upload instructions)
 * Triggers a browser download of the bundled ZIP.
 *
 * Throws if any of the three PDF assembly calls fail.
 */
export async function downloadStoryBook(
  args: DownloadStoryBookArgs,
): Promise<void> {
  const done = args.items.filter((i) => i.status === "done" && i.dataUrl);
  if (
    done.length === 0 ||
    args.cover.status !== "done" ||
    !args.cover.dataUrl ||
    args.backCover.status !== "done" ||
    !args.backCover.dataUrl
  ) {
    throw new Error(
      "Front cover, back cover, and at least one interior page are required for the KDP download.",
    );
  }

  const safeName = safeFileName(args.plan?.coverTitle, "story-book");
  const storyPages = done.map((d) => ({
    id: d.id,
    name: d.name,
    dataUrl: d.dataUrl,
  }));
  if (args.theEndPage?.status === "done" && args.theEndPage.dataUrl) {
    storyPages.push({
      id: "the-end",
      name: "The End",
      dataUrl: args.theEndPage.dataUrl,
    });
  }

  const storyBaseBody = {
    title: args.plan?.coverTitle ?? args.plan?.title,
    cover: { dataUrl: args.cover.dataUrl },
    backCover: { dataUrl: args.backCover.dataUrl },
    pages: storyPages,
  };

  const [coverRes, interiorRes, etsyA4Res] = await Promise.all([
    fetch("/api/assemble-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: args.plan?.coverTitle ?? "story-book",
        cover: { dataUrl: args.cover.dataUrl },
        backCover: { dataUrl: args.backCover.dataUrl },
        mode: "cover-wrap",
        paper: "standardColor",
        interiorPageCount: storyPages.length,
        trimWidthInches: 6,
        trimHeightInches: 9,
      }),
    }),
    fetch("/api/assemble-story-book-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: args.plan?.coverTitle ?? args.plan?.title,
        pages: storyPages,
        trimWidthInches: 6,
        trimHeightInches: 9,
      }),
    }),
    fetch("/api/assemble-story-book-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...storyBaseBody,
        trimWidthInches: 8.27,
        trimHeightInches: 11.69,
      }),
    }),
  ]);

  if (!coverRes.ok) {
    const j = await coverRes.json().catch(() => ({}));
    throw new Error(j.error || "Story cover-wrap PDF failed");
  }
  if (!interiorRes.ok) {
    const j = await interiorRes.json().catch(() => ({}));
    throw new Error(j.error || "Story interior PDF failed");
  }
  if (!etsyA4Res.ok) {
    const j = await etsyA4Res.json().catch(() => ({}));
    throw new Error(j.error || "Story Etsy A4 PDF failed");
  }

  const [coverBlob, interiorBlob, etsyA4Blob] = await Promise.all([
    coverRes.blob(),
    interiorRes.blob(),
    etsyA4Res.blob(),
  ]);

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file(`${safeName}_cover_KDP.pdf`, await coverBlob.arrayBuffer());
  zip.file(`${safeName}_interior_KDP.pdf`, await interiorBlob.arrayBuffer());
  zip.file(`${safeName}_etsy_a4.pdf`, await etsyA4Blob.arrayBuffer());
  zip.file(
    "README.txt",
    [
      "CrayonSparks → Story-book print package",
      "",
      `Title:  ${args.plan?.coverTitle ?? args.plan?.title ?? "Story book"}`,
      `Pages:  ${storyPages.length} interior scenes`,
      `Trim:   6 × 9 inches (KDP color paperback standard)`,
      "",
      "This zip contains 3 PDFs — pick the ones that match where",
      "you're publishing.",
      "",
      "── AMAZON KDP (color paperback) ──────────────────────────────",
      `  1. ${safeName}_cover_KDP.pdf`,
      "     Upload to the COVER section of KDP. Sized to KDP's exact",
      `     cover-wrap dimensions (back + spine + front + 0.125" bleed)`,
      "     for color paper at this interior page count.",
      "",
      `  2. ${safeName}_interior_KDP.pdf`,
      "     Upload to the INTERIOR / MANUSCRIPT section. Story scenes",
      "     in narrative order, full-bleed, no blank pages between",
      "     (story books print both sides full-color, unlike coloring",
      "     books which need alternating blanks).",
      "",
      "  Help: https://kdp.amazon.com/en_US/help/topic/G201834260",
      "",
      "── ETSY / GUMROAD (digital download) ─────────────────────────",
      "  Single PDF in this order:",
      "    • Page 1     — Front cover (full color)",
      "    • Pages 2..N — Story scenes back-to-back (no blanks)",
      "    • Last page  — Back cover",
      "",
      `  3. ${safeName}_etsy_a4.pdf — A4 (210×297 mm)`,
      "     A4 is the standard worldwide outside the US and prints",
      "     fine on US Letter printers (slight margin trim).",
    ].join("\n"),
  );

  const zipBytes = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  triggerDownload(zipBytes, `${safeName}_print_package.zip`);
}
