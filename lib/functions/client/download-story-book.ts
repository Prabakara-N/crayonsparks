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
 * Builds a print package for a STORY BOOK as one zip:
 *   target "kdp"  -> cover_KDP.pdf (6x9 cover-wrap) + interior_KDP.pdf (full-bleed)
 *   target "etsy" -> etsy_letter.pdf + etsy_a4.pdf (full sequence, full-bleed)
 */
export async function downloadStoryBook(
  args: DownloadStoryBookArgs,
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

  const safeName = safeFileName(args.plan?.coverTitle, "story-book");
  const title = args.plan?.coverTitle ?? args.plan?.title;
  const storyPages = done.map((d) => ({
    id: d.id,
    name: d.name,
    dataUrl: d.dataUrl,
    bubbles:
      d.bubbles && d.bubbles.length > 0 && !d.bubblesFlattened
        ? d.bubbles
        : undefined,
  }));
  if (args.theEndPage?.status === "done" && args.theEndPage.dataUrl) {
    storyPages.push({
      id: "the-end",
      name: "The End",
      dataUrl: args.theEndPage.dataUrl,
      bubbles: undefined,
    });
  }

  const post = (url: string, body: Record<string, unknown>) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const ensureOk = async (res: Response, label: string): Promise<Blob> => {
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error || `${label} failed`);
    }
    return res.blob();
  };

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  if (target === "kdp") {
    const [coverRes, interiorRes] = await Promise.all([
      post("/api/assemble-pdf", {
        category: title ?? "story-book",
        cover: { dataUrl: args.cover.dataUrl },
        backCover: { dataUrl: args.backCover.dataUrl },
        mode: "cover-wrap",
        paper: "standardColor",
        interiorPageCount: storyPages.length,
        trimWidthInches: 6,
        trimHeightInches: 9,
      }),
      post("/api/assemble-story-book-pdf", {
        title,
        pages: storyPages,
        trimWidthInches: 6,
        trimHeightInches: 9,
      }),
    ]);
    zip.file(`${safeName}_cover_KDP.pdf`, await ensureOk(coverRes, "Story cover-wrap PDF"));
    zip.file(`${safeName}_interior_KDP.pdf`, await ensureOk(interiorRes, "Story interior PDF"));
  } else {
    const etsyBody = {
      title,
      cover: { dataUrl: args.cover.dataUrl },
      backCover: { dataUrl: args.backCover.dataUrl },
      pages: storyPages,
    };
    const [letterRes, a4Res] = await Promise.all([
      post("/api/assemble-story-book-pdf", { ...etsyBody, trimWidthInches: 8.5, trimHeightInches: 11 }),
      post("/api/assemble-story-book-pdf", { ...etsyBody, trimWidthInches: 8.27, trimHeightInches: 11.69 }),
    ]);
    zip.file(`${safeName}_etsy_letter.pdf`, await ensureOk(letterRes, "Story Etsy Letter PDF"));
    zip.file(`${safeName}_etsy_a4.pdf`, await ensureOk(a4Res, "Story Etsy A4 PDF"));
  }

  const zipBytes = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  triggerDownload(zipBytes, `${safeName}_${target}_package.zip`);
}
