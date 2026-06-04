"use client";

import { type ReactNode } from "react";
import { CheckCircle2, Eye, Loader2, RefreshCw, Download, MessageSquare, BookPlus, XCircle } from "lucide-react";

export interface CoverTileStatus {
  status: "pending" | "generating" | "done" | "error";
  dataUrl?: string;
  error?: string;
}

interface CoverTileProps {
  label: string;
  state: CoverTileStatus;
  onRegenerate: () => void;
  onRefine?: (dataUrl: string) => void;
  onView?: (dataUrl: string) => void;
  disabled?: boolean;
  disabledReason?: string;
  regenerateOnlyLocked?: boolean;
  regenerateOnlyLockedReason?: string;
  showBarcodeZone?: boolean;
  downloadName?: string;
  aspect?: string;
  refineState?: "running" | "done";
  extraAction?: ReactNode;
  hideRegenerate?: boolean;
}

/**
 * One cover tile (front OR back) — shared by BookStudio and GeneratorStudio
 * so both pages render covers identically.
 */
export function CoverTile({
  label,
  state,
  onRegenerate,
  onRefine,
  onView,
  disabled = false,
  disabledReason,
  regenerateOnlyLocked = false,
  regenerateOnlyLockedReason,
  showBarcodeZone = false,
  downloadName,
  aspect = "3 / 4",
  refineState,
  extraAction,
  hideRegenerate = false,
}: CoverTileProps) {
  // Click behaviour priority: refine when not disabled and onRefine is wired,
  // otherwise view-only (opens lightbox) so the user can still see the
  // image when refine is locked. Only fully unclickable if the image
  // doesn't exist yet OR neither handler is wired.
  const canRefine = !disabled && !!onRefine && !!state.dataUrl;
  const canView = !!onView && !!state.dataUrl;
  const handleClick = () => {
    if (!state.dataUrl) return;
    if (canRefine) onRefine?.(state.dataUrl);
    else if (canView) onView?.(state.dataUrl);
  };
  const tileTitle = canRefine
    ? "Click to refine"
    : canView
      ? "Click to view at full size"
      : disabled
        ? disabledReason
        : undefined;

  return (
    <div className="flex flex-col gap-2 min-w-0 w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={!state.dataUrl || (!canRefine && !canView)}
        className="relative w-full rounded-2xl overflow-hidden bg-linear-to-br from-zinc-800 to-zinc-900 border border-white/10 group disabled:cursor-default enabled:hover:border-violet-500/50 enabled:hover:shadow-lg enabled:hover:shadow-violet-500/20 transition-all"
        style={{ aspectRatio: aspect }}
        title={tileTitle}
      >
        {state.status === "done" && state.dataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.dataUrl}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {canRefine ? (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs font-semibold">Click to refine</span>
              </div>
            ) : canView ? (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                <Eye className="w-5 h-5" />
                <span className="text-xs font-semibold">Click to view</span>
              </div>
            ) : null}
          </>
        ) : state.status === "generating" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-violet-300">
            <Loader2 className="w-7 h-7 animate-spin" />
            <p className="text-xs font-medium">Generating…</p>
          </div>
        ) : state.status === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-950/30 p-4 text-center">
            <XCircle className="w-6 h-6 text-red-400" />
            <p className="text-[11px] text-red-200 max-w-[90%]">
              {state.error ?? "Failed"}
            </p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-500">
            <BookPlus className="w-7 h-7" />
            <p className="text-xs font-medium">{label}</p>
          </div>
        )}
        {/* Top-left label chip */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur text-white border border-white/15 z-10">
          {label}
        </div>
        {/* Top-right refine-status pill: surfaces "Refining…" while a
            background refine is in flight on this tile, then "Refined"
            for a few seconds when the new image lands. Mirrors the
            equivalent pill on interior page cards. */}
        {refineState === "running" && (
          <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/30 backdrop-blur text-amber-100 border border-amber-400/50 z-10">
            <Loader2 className="w-3 h-3 animate-spin" />
            Refining
          </div>
        )}
        {refineState === "done" && (
          <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-500/30 backdrop-blur text-cyan-100 border border-cyan-400/50 z-10">
            <CheckCircle2 className="w-3 h-3" />
            Refined
          </div>
        )}
      </button>

      <div className="flex items-center gap-2">
        {hideRegenerate && extraAction ? (
          // Back cover: the "Edit back cover" action takes the primary slot, on
          // the same row as download — mirroring the front cover's layout.
          <div className="flex-1 min-w-0">{extraAction}</div>
        ) : (
          !(hideRegenerate && state.dataUrl) && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={
                state.status === "generating" || disabled || regenerateOnlyLocked
              }
              title={
                disabled
                  ? disabledReason
                  : regenerateOnlyLocked
                    ? regenerateOnlyLockedReason
                    : undefined
              }
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-linear-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {state.status === "generating" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {state.dataUrl ? "Regenerate" : "Generate"}
            </button>
          )
        )}
        {state.dataUrl && downloadName && (
          <a
            href={state.dataUrl}
            download={downloadName}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/20"
            title="Download PNG"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      {!(hideRegenerate && extraAction) && extraAction}
      {disabled && disabledReason && !state.dataUrl && (
        <p className="text-[10px] text-violet-300/80 italic leading-snug">
          🔒 {disabledReason}
        </p>
      )}
      {regenerateOnlyLocked && regenerateOnlyLockedReason && state.dataUrl && (
        <p className="text-[10px] text-violet-300/80 italic leading-snug">
          🔒 {regenerateOnlyLockedReason}
        </p>
      )}
    </div>
  );
}
