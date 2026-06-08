"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Download, ImagePlus } from "lucide-react";
import { computeCoverDimensions, type KdpPaperType } from "@/lib/kdp-cover-pdf";
import { BackCoverEditorModal } from "@/components/playground/book-studio/back-cover-grid/editor/back-cover-editor-modal";
import type { BackCoverDesign } from "@/components/playground/book-studio/back-cover-grid/back-cover-grid-types";
import { downloadSingleCover } from "@/lib/functions/client/download-single-cover";
import { COVER_TRIMS, DEFAULT_COVER_TRIM } from "./cover-trim-config";
import { TrimSizePicker } from "./trim-size-picker";
import { PaperTypePicker } from "./paper-type-picker";
import { CoverFrontGenerator } from "./cover-front-generator";
import { CoverFrontPreview } from "./cover-front-preview";
import { CoverFrontOverlayControls } from "./cover-front-overlay-controls";
import { composeFrontCover } from "./cover-front-compose";
import { defaultFrontText, type FrontTextModel } from "./cover-types";

export function CoverStudio() {
  const [trimId, setTrimId] = useState(DEFAULT_COVER_TRIM.id);
  const [paper, setPaper] = useState<KdpPaperType>("bw");
  const [pageCount, setPageCount] = useState(24);
  const [bookTitle, setBookTitle] = useState("");
  const [frontArt, setFrontArt] = useState<string | null>(null);
  const [frontText, setFrontText] = useState<FrontTextModel>(defaultFrontText);
  const [back, setBack] = useState<{ dataUrl: string; design: BackCoverDesign } | null>(null);
  const [backOpen, setBackOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trim = COVER_TRIMS.find((t) => t.id === trimId) ?? DEFAULT_COVER_TRIM;
  const dims = useMemo(
    () =>
      computeCoverDimensions({
        trimWidthInches: trim.widthIn,
        trimHeightInches: trim.heightIn,
        interiorPageCount: Math.max(1, pageCount),
        paper,
      }),
    [trim, pageCount, paper],
  );

  async function handleDownload() {
    if (!frontArt || !back) return;
    setDownloading(true);
    setError(null);
    try {
      const frontFinal = await composeFrontCover(frontArt, frontText, trim.gridAspect);
      await downloadSingleCover({
        frontDataUrl: frontFinal,
        backDataUrl: back.dataUrl,
        trimWidthInches: trim.widthIn,
        trimHeightInches: trim.heightIn,
        interiorPageCount: Math.max(1, pageCount),
        paper,
        fileName: `${(bookTitle || "book").replace(/[^a-z0-9]+/gi, "_")}_cover_KDP.pdf`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not download the cover.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-zinc-950/60 shadow-2xl shadow-violet-500/10">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Book cover maker
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Generate a front cover, design a back cover, and download a
            print-ready wraparound PDF (back + spine + front).
          </p>
        </div>
        <Link
          href="/playground"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Playground
        </Link>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TrimSizePicker value={trimId} onChange={setTrimId} />
          <PaperTypePicker value={paper} onChange={setPaper} />
          <label className="block">
            <span className="block text-xs font-medium text-neutral-300 mb-1.5">
              Interior pages
            </span>
            <input
              type="number"
              min={1}
              value={pageCount}
              onChange={(e) => setPageCount(Math.max(1, Number(e.target.value) || 1))}
              className="w-full h-10 rounded-lg border border-white/10 bg-black/50 px-3 text-sm text-white focus:outline-none focus:border-violet-500/60"
            />
          </label>
        </div>
        <p className="text-[11px] text-neutral-500">
          Upload size: {dims.totalWidthInches.toFixed(2)} ×{" "}
          {dims.totalHeightInches.toFixed(2)} in · spine{" "}
          {dims.spineWidthInches.toFixed(3)} in. Generate the front art at the{" "}
          {trim.frontAspect} aspect for the best fit.
        </p>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">1 · Front cover</h2>
          <CoverFrontGenerator
            trim={trim}
            bookTitle={bookTitle}
            onBookTitleChange={setBookTitle}
            hasArt={!!frontArt}
            onArt={setFrontArt}
          />
          {frontArt && (
            <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
              <CoverFrontOverlayControls value={frontText} onChange={setFrontText} />
              <div>
                <p className="mb-1.5 text-xs font-medium text-neutral-400">Front preview</p>
                <div className="max-w-[280px]">
                  <CoverFrontPreview art={frontArt} text={frontText} aspect={trim.gridAspect} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <h2 className="mb-2 text-sm font-semibold text-white">2 · Back cover</h2>
          <button
            type="button"
            onClick={() => setBackOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            <ImagePlus className="h-4 w-4" />
            {back ? "Edit back cover" : "Design back cover"}
          </button>
          {back && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-neutral-400">Back preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={back.dataUrl}
                alt="Back cover"
                className="max-w-[280px] rounded-xl border border-white/10"
              />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={!frontArt || !back || downloading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-violet-500 via-indigo-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download cover PDF (back + spine + front)
        </button>
        {(!frontArt || !back) && (
          <p className="text-center text-[11px] text-neutral-500">
            Generate a front cover and design a back cover to enable download.
          </p>
        )}
      </div>

      {backOpen && (
        <BackCoverEditorModal
          aspect={trim.gridAspect}
          available={[]}
          frontCoverDataUrl={frontArt ?? undefined}
          bookTitle={bookTitle || "My book"}
          bookKind="coloring"
          initialDesign={back?.design}
          onApply={({ dataUrl, design }) => {
            setBack({ dataUrl, design });
            setBackOpen(false);
          }}
          onClose={() => setBackOpen(false)}
        />
      )}
    </div>
  );
}
