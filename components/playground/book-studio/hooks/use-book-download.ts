"use client";

import { useCallback, useState } from "react";
import { useDialog } from "@/components/ui/confirm-dialog";
import { downloadBookZip } from "@/lib/functions/client/download-book-zip";
import { downloadColoringBook } from "@/lib/functions/client/download-coloring-book";
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

  const downloadPdf = useCallback(async () => {
    setPdfBuilding(true);
    try {
      if (mode === "story") {
        await downloadStoryBook({
          plan,
          items,
          cover,
          backCover,
          theEndPage,
        });
      } else {
        await downloadColoringBook({
          plan,
          items,
          cover,
          backCover,
          belongsTo,
          belongsToStyle,
        });
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
  }, [
    items,
    cover,
    backCover,
    belongsTo,
    belongsToStyle,
    theEndPage,
    plan,
    mode,
    dialog,
  ]);

  return {
    pdfBuilding,
    setPdfBuilding,
    downloadPdf,
    downloadZip,
  };
}
