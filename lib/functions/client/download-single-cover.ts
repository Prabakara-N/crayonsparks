import type { KdpPaperType } from "@/lib/kdp-cover-pdf";

export interface DownloadSingleCoverArgs {
  frontDataUrl: string;
  backDataUrl: string;
  trimWidthInches: number;
  trimHeightInches: number;
  interiorPageCount: number;
  paper: KdpPaperType;
  fileName?: string;
}

// Builds the wraparound cover PDF (back + spine + front) via the shared
// /api/assemble-pdf cover-wrap route and triggers a browser download.
export async function downloadSingleCover(
  args: DownloadSingleCoverArgs,
): Promise<void> {
  const res = await fetch("/api/assemble-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "cover-wrap",
      category: "cover",
      cover: { dataUrl: args.frontDataUrl },
      backCover: { dataUrl: args.backDataUrl },
      trimWidthInches: args.trimWidthInches,
      trimHeightInches: args.trimHeightInches,
      interiorPageCount: args.interiorPageCount,
      paper: args.paper,
    }),
  });
  if (!res.ok) {
    let message = "Could not build the cover PDF.";
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // non-JSON error body — keep the default message
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = args.fileName ?? "book_cover_KDP.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
