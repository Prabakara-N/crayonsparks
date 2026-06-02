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
 * Builds a print package for a COLORING BOOK as one zip via a single
 * `mode: "package"` request (images decoded once, server-zipped):
 *   target "kdp"  -> cover_KDP.pdf + interior_KDP.pdf (alternating blanks)
 *   target "etsy" -> etsy_letter.pdf + etsy_a4.pdf (no blanks)
 */
export async function downloadColoringBook(
  args: DownloadColoringBookArgs,
  target: "kdp" | "etsy" = "kdp",
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
    paper: "bw",
    cover: { dataUrl: args.cover.dataUrl },
    backCover: { dataUrl: args.backCover.dataUrl },
    belongsTo:
      args.belongsTo.status === "done" && args.belongsTo.dataUrl
        ? { dataUrl: args.belongsTo.dataUrl, style: args.belongsToStyle }
        : undefined,
    pages: done.map((d) => ({ id: d.id, name: d.name, dataUrl: d.dataUrl })),
  };

  const res = await fetch("/api/assemble-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...baseBody, mode: "package", target }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "Print package build failed");
  }
  const safeName = safeFileName(args.plan?.coverTitle, "book");
  triggerDownload(await res.blob(), `${safeName}_${target}_package.zip`);
}
