"use client";

import { useCallback, useState } from "react";
import { useDialog } from "@/components/ui/confirm-dialog";
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
  mode: "qa" | "story";
}

export function useBookDownload({
  plan,
  items,
  cover,
  backCover,
  belongsTo,
  belongsToStyle,
  mode,
}: UseBookDownloadArgs) {
  const dialog = useDialog();
  const [pdfBuilding, setPdfBuilding] = useState(false);

  const downloadZip = useCallback(async () => {
    const done = items.filter((i) => i.status === "done" && i.dataUrl);
    if (done.length === 0 && cover.status !== "done") return;
    setPdfBuilding(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      if (cover.status === "done" && cover.dataUrl) {
        zip.file("00_cover.png", cover.dataUrl.split(",")[1], { base64: true });
      }
      if (
        belongsTo.status === "done" &&
        belongsTo.dataUrl &&
        mode !== "story"
      ) {
        zip.file("01_belongs_to.png", belongsTo.dataUrl.split(",")[1], {
          base64: true,
        });
      }
      for (const item of done) {
        const safe = item.name.replace(/[^a-z0-9]+/gi, "_");
        zip.file(`${item.id}_${safe}.png`, item.dataUrl!.split(",")[1], {
          base64: true,
        });
      }
      if (backCover.status === "done" && backCover.dataUrl) {
        zip.file("zz_back_cover.png", backCover.dataUrl.split(",")[1], {
          base64: true,
        });
      }
      const blob = await zip.generateAsync({
        type: "blob",
        compression: "STORE",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(plan?.coverTitle ?? "coloring-book").replace(/[^a-z0-9]+/gi, "_")}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setPdfBuilding(false);
    }
  }, [items, cover, backCover, belongsTo, mode, plan]);

  const downloadPdf = useCallback(async () => {
    const done = items.filter((i) => i.status === "done" && i.dataUrl);
    if (
      done.length === 0 ||
      cover.status !== "done" ||
      !cover.dataUrl ||
      backCover.status !== "done" ||
      !backCover.dataUrl
    ) {
      void dialog.alert({
        title: "Print package not ready",
        message:
          "Front cover, back cover, and at least one interior page are required for the KDP download.",
        variant: "info",
      });
      return;
    }
    setPdfBuilding(true);
    try {
      if (mode === "story") {
        const safeName = (plan?.coverTitle ?? "story-book").replace(
          /[^a-z0-9]+/gi,
          "_",
        );
        const storyPages = done.map((d) => ({
          id: d.id,
          name: d.name,
          dataUrl: d.dataUrl,
        }));
        const storyBaseBody = {
          title: plan?.coverTitle ?? plan?.title,
          cover: { dataUrl: cover.dataUrl },
          backCover: { dataUrl: backCover.dataUrl },
          pages: storyPages,
        };
        const [coverRes, interiorRes, etsyA4Res] = await Promise.all([
          fetch("/api/assemble-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: plan?.coverTitle ?? "story-book",
              cover: { dataUrl: cover.dataUrl },
              backCover: { dataUrl: backCover.dataUrl },
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
              title: plan?.coverTitle ?? plan?.title,
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
        zip.file(
          `${safeName}_cover_KDP.pdf`,
          await coverBlob.arrayBuffer(),
        );
        zip.file(
          `${safeName}_interior_KDP.pdf`,
          await interiorBlob.arrayBuffer(),
        );
        zip.file(`${safeName}_etsy_a4.pdf`, await etsyA4Blob.arrayBuffer());
        zip.file(
          "README.txt",
          [
            "CrayonSparks → Story-book print package",
            "",
            `Title:  ${plan?.coverTitle ?? plan?.title ?? "Story book"}`,
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
        const url = URL.createObjectURL(zipBytes);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeName}_print_package.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setPdfBuilding(false);
        return;
      }
      const baseBody = {
        title: plan?.title,
        category: plan?.coverTitle ?? "book",
        cover: { dataUrl: cover.dataUrl },
        backCover: { dataUrl: backCover.dataUrl },
        belongsTo:
          belongsTo.status === "done" && belongsTo.dataUrl
            ? { dataUrl: belongsTo.dataUrl, style: belongsToStyle }
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
              (belongsTo.status === "done" && belongsTo.dataUrl ? 2 : 0),
            paper: "bw",
            trimWidthInches: 8.5,
            trimHeightInches: 11,
          }),
        }),
        fetch("/api/assemble-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...baseBody,
            mode: "interior",
          }),
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
      const safeName = (plan?.coverTitle ?? "book").replace(
        /[^a-z0-9]+/gi,
        "_",
      );
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
      const url = URL.createObjectURL(zipBytes);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}_print_package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      void dialog.alert({
        title: "PDF assembly failed",
        message: e instanceof Error ? e.message : "PDF assembly failed",
        variant: "danger",
      });
    } finally {
      setPdfBuilding(false);
    }
  }, [items, cover, backCover, belongsTo, belongsToStyle, plan, mode, dialog]);

  return {
    pdfBuilding,
    setPdfBuilding,
    downloadPdf,
    downloadZip,
  };
}
