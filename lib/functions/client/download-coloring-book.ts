"use client";

import type { Plan, PromptItem } from "@/components/playground/book-studio/types";
import { safeFileName, triggerDownload } from "./trigger-download";

interface CoverSlice {
  status: "pending" | "generating" | "done" | "error";
  dataUrl?: string;
}

export interface DownloadColoringBookArgs {
  plan: Plan | null;
  items: PromptItem[];
  cover: CoverSlice;
  backCover: CoverSlice;
  belongsTo: CoverSlice;
  belongsToStyle: "bw" | "color";
}

/**
 * Builds the full KDP print package for a COLORING BOOK:
 *   - cover_KDP.pdf       (cover-wrap, B&W paper sizing)
 *   - interior_KDP.pdf    (interior with alternating blank pages)
 *   - etsy_a4.pdf         (single A4 PDF for Etsy / Gumroad)
 *   - README.txt          (upload instructions)
 * Triggers a browser download of the bundled ZIP.
 *
 * Throws if any of the three PDF assembly calls fail. Caller decides
 * how to surface errors (toast, dialog, etc.).
 */
export async function downloadColoringBook(
  args: DownloadColoringBookArgs,
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

  const baseBody = {
    title: args.plan?.title,
    category: args.plan?.coverTitle ?? "book",
    cover: { dataUrl: args.cover.dataUrl },
    backCover: { dataUrl: args.backCover.dataUrl },
    belongsTo:
      args.belongsTo.status === "done" && args.belongsTo.dataUrl
        ? { dataUrl: args.belongsTo.dataUrl, style: args.belongsToStyle }
        : undefined,
    pages: done.map((d) => ({
      id: d.id,
      name: d.name,
      dataUrl: d.dataUrl,
    })),
  };

  const [coverRes, interiorRes, etsyA4Res] = await Promise.all([
    fetch("/api/assemble-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...baseBody,
        mode: "cover-wrap",
        interiorPageCount:
          done.length * 2 +
          (args.belongsTo.status === "done" && args.belongsTo.dataUrl ? 2 : 0),
        paper: "bw",
        trimWidthInches: 8.5,
        trimHeightInches: 11,
      }),
    }),
    fetch("/api/assemble-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...baseBody, mode: "interior" }),
    }),
    fetch("/api/assemble-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...baseBody,
        mode: "combined",
        includeBlankPages: false,
        trimWidthInches: 8.27,
        trimHeightInches: 11.69,
      }),
    }),
  ]);

  if (!coverRes.ok) {
    const j = await coverRes.json().catch(() => ({}));
    throw new Error(j.error || "Cover-wrap PDF failed");
  }
  if (!interiorRes.ok) {
    const j = await interiorRes.json().catch(() => ({}));
    throw new Error(j.error || "Interior PDF failed");
  }
  if (!etsyA4Res.ok) {
    const j = await etsyA4Res.json().catch(() => ({}));
    throw new Error(j.error || "Etsy A4 PDF failed");
  }

  const [coverBlob, interiorBlob, etsyA4Blob] = await Promise.all([
    coverRes.blob(),
    interiorRes.blob(),
    etsyA4Res.blob(),
  ]);

  const { default: JSZip } = await import("jszip");
  const safeName = safeFileName(args.plan?.coverTitle, "book");
  const zip = new JSZip();
  zip.file(`${safeName}_cover_KDP.pdf`, await coverBlob.arrayBuffer());
  zip.file(`${safeName}_interior_KDP.pdf`, await interiorBlob.arrayBuffer());
  zip.file(`${safeName}_etsy_a4.pdf`, await etsyA4Blob.arrayBuffer());
  zip.file(
    "README.txt",
    [
      "CrayonSparks → Print package",
      "",
      "This zip contains 3 PDFs — pick the ones that match where you're",
      "publishing.",
      "",
      "── AMAZON KDP (paperback) ────────────────────────────────────",
      `  1. ${safeName}_cover_KDP.pdf`,
      "     Upload to the COVER section of KDP. Sized to KDP's exact",
      "     cover-wrap dimensions (back + spine + front + 0.125\" bleed).",
      "",
      `  2. ${safeName}_interior_KDP.pdf`,
      "     Upload to the INTERIOR / MANUSCRIPT section. Contains the",
      "     'This Book Belongs To' page followed by every coloring page",
      "     with KDP's required alternating blank pages.",
      "",
      "  Help: https://kdp.amazon.com/en_US/help/topic/G201834260",
      "",
      "── ETSY / GUMROAD (digital download) ─────────────────────────",
      "  Single PDF in this order:",
      "    • Page 1     — Front cover (full color)",
      "    • Page 2     — 'This Book Belongs To' nameplate",
      "    • Pages 3..N — Coloring pages, back-to-back (no blanks)",
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
