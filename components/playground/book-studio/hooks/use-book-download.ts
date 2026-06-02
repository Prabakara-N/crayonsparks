"use client";

import { useCallback, useState } from "react";
import { useDialog } from "@/components/ui/confirm-dialog";
import { downloadBookZip } from "@/lib/functions/client/download-book-zip";
import { downloadColoringBook } from "@/lib/functions/client/download-coloring-book";
import { downloadActivityBook } from "@/lib/functions/client/download-activity-book";
import { downloadStoryBook } from "@/lib/functions/client/download-story-book";
import type { Plan, PromptItem } from "../types";

interface CoverSlice {
  status: "pending" | "generating" | "done" | "error";
  dataUrl?: string;
}

interface UseBookDownloadArgs {
  plan: Plan | null;
  items: PromptItem[];
  cover: CoverSlice;
  backCover: CoverSlice;
  belongsTo: CoverSlice;
  belongsToStyle: "bw" | "color";
  theEndPage?: CoverSlice;
  mode: "qa" | "story";
  bookKind?: "coloring" | "story" | "activity";
}

export function useBookDownload({
  plan,
  items,
  cover,
  backCover,
  belongsTo,
  belongsToStyle,
  theEndPage,
  mode,
  bookKind,
}: UseBookDownloadArgs) {
  const dialog = useDialog();
  const [pdfBuilding, setPdfBuilding] = useState(false);

  const downloadZip = useCallback(async () => {
    setPdfBuilding(true);
    try {
      await downloadBookZip({
        plan,
        items,
        cover,
        backCover,
        belongsTo,
        theEndPage,
        mode,
      });
    } finally {
      setPdfBuilding(false);
    }
  }, [items, cover, backCover, belongsTo, theEndPage, mode, plan]);

  // Builds either the KDP or the Etsy package for whichever book kind this is.
  const runDownload = useCallback(
    async (target: "kdp" | "etsy") => {
      setPdfBuilding(true);
      try {
        if (bookKind === "activity") {
          await downloadActivityBook(
            { plan, items, cover, backCover, belongsTo, belongsToStyle, includeAnswerKey: true },
            target,
          );
        } else if (mode === "story") {
          await downloadStoryBook({ plan, items, cover, backCover, theEndPage }, target);
        } else {
          await downloadColoringBook({ plan, items, cover, backCover, belongsTo, belongsToStyle }, target);
        }
      } catch (e) {
        void dialog.alert({
          title: "PDF assembly failed",
          message: e instanceof Error ? e.message : "PDF assembly failed",
          variant: "danger",
        });
      } finally {
        setPdfBuilding(false);
      }
    },
    [items, cover, backCover, belongsTo, belongsToStyle, theEndPage, plan, mode, bookKind, dialog],
  );

  const downloadPdf = useCallback(() => runDownload("kdp"), [runDownload]);
  const downloadPdfEtsy = useCallback(() => runDownload("etsy"), [runDownload]);

  return {
    pdfBuilding,
    setPdfBuilding,
    downloadPdf,
    downloadPdfEtsy,
    downloadZip,
  };
}
