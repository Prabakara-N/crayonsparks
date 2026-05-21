"use client";

import type { Plan, PromptItem } from "@/components/playground/book-studio/types";
import { safeFileName, triggerDownload } from "./trigger-download";

interface CoverSlice {
  status: "pending" | "generating" | "done" | "error";
  dataUrl?: string;
}

export interface DownloadBookZipArgs {
  plan: Plan | null;
  items: PromptItem[];
  cover: CoverSlice;
  backCover: CoverSlice;
  belongsTo: CoverSlice;
  theEndPage?: CoverSlice;
  mode: "qa" | "story";
}

/**
 * Builds a flat ZIP of every generated PNG in narrative order:
 *   00_cover, 01_belongs_to (coloring only), pNN_<name>, zy_the_end (story only), zz_back_cover.
 * No PDF, no print package — just the raw images for the user to do whatever.
 */
export async function downloadBookZip(args: DownloadBookZipArgs): Promise<void> {
  const done = args.items.filter((i) => i.status === "done" && i.dataUrl);
  if (done.length === 0 && args.cover.status !== "done") return;

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  if (args.cover.status === "done" && args.cover.dataUrl) {
    zip.file("00_cover.png", args.cover.dataUrl.split(",")[1], { base64: true });
  }
  if (
    args.mode !== "story" &&
    args.belongsTo.status === "done" &&
    args.belongsTo.dataUrl
  ) {
    zip.file("01_belongs_to.png", args.belongsTo.dataUrl.split(",")[1], {
      base64: true,
    });
  }
  for (const item of done) {
    const safe = item.name.replace(/[^a-z0-9]+/gi, "_");
    zip.file(`${item.id}_${safe}.png`, item.dataUrl!.split(",")[1], {
      base64: true,
    });
  }
  if (
    args.mode === "story" &&
    args.theEndPage?.status === "done" &&
    args.theEndPage.dataUrl
  ) {
    zip.file("zy_the_end.png", args.theEndPage.dataUrl.split(",")[1], {
      base64: true,
    });
  }
  if (args.backCover.status === "done" && args.backCover.dataUrl) {
    zip.file("zz_back_cover.png", args.backCover.dataUrl.split(",")[1], {
      base64: true,
    });
  }

  const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
  triggerDownload(blob, `${safeFileName(args.plan?.coverTitle, "coloring-book")}.zip`);
}
