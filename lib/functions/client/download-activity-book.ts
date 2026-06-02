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

// Builds a print package for an ACTIVITY BOOK as one zip:
//   target "kdp"  -> cover_KDP.pdf + interior_KDP.pdf
//   target "etsy" -> etsy_letter.pdf + etsy_a4.pdf
export async function downloadActivityBook(
  args: DownloadActivityBookArgs,
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
    pageBorder: false,
    paper: "bw",
  };

  // One request → server builds all 4 PDFs (images decoded once) and returns
  // the zip. Avoids re-sending the full image payload 4 times.
  const res = await fetch("/api/assemble-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...baseBody, mode: "package", target }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "Print package build failed");
  }
  const safeName = safeFileName(args.plan?.coverTitle, "activity-book");
  triggerDownload(await res.blob(), `${safeName}_${target}_package.zip`);
}
