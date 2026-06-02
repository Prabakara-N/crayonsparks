"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Images, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractCoverPalette } from "@/lib/extract-cover-palette";
import { shadeHex, tintHex } from "@/lib/colors/derive";
import { InteriorImagePicker } from "../interior-image-picker";
import { composeBackCover } from "../compose-grid";
import { DesignOverlay } from "./design-overlay";
import { PalettePicker } from "./palette-picker";
import { TaglineGenerator } from "./tagline-generator";
import {
  gridImageCount,
  makeDefaultDesign,
  TAGLINE_COLORS,
  TAGLINE_FONTS,
  type BackCoverDesign,
  type FontKey,
  type GridAspect,
  type GridSize,
  type SelectableImage,
} from "../back-cover-grid-types";

interface BackCoverEditorModalProps {
  aspect: GridAspect;
  available: SelectableImage[];
  frontCoverDataUrl?: string;
  bookTitle: string;
  coverScene?: string;
  bookDescription?: string;
  audience?: string;
  pageCount?: number;
  bookKind: "coloring" | "story" | "activity";
  initialDesign?: BackCoverDesign;
  onApply: (result: { dataUrl: string; design: BackCoverDesign }) => void;
  onClose: () => void;
}

export function BackCoverEditorModal({
  aspect,
  available,
  frontCoverDataUrl,
  bookTitle,
  coverScene,
  bookDescription,
  audience,
  pageCount,
  bookKind,
  initialDesign,
  onApply,
  onClose,
}: BackCoverEditorModalProps) {
  const [design, setDesign] = useState<BackCoverDesign>(
    initialDesign ?? makeDefaultDesign(bookDescription ?? ""),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matchedRef = useRef(false);

  // Match the back cover to the FRONT cover: tint the dominant cover hue for
  // the body color and a dark shade of it for the top stripe. Runs once on a
  // fresh design (skips when editing an existing/saved back cover).
  useEffect(() => {
    if (initialDesign || matchedRef.current || !frontCoverDataUrl) return;
    matchedRef.current = true;
    let cancelled = false;
    void extractCoverPalette(frontCoverDataUrl).then((swatches) => {
      if (cancelled || !swatches.length) return;
      const dom = swatches[0].hex;
      setDesign((d) => ({
        ...d,
        bgColor: tintHex(dom),
        topStripe: { ...d.topStripe, color: shadeHex(dom) },
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [frontCoverDataUrl, initialDesign]);

  const needed = gridImageCount(design.gridSize);
  const selectedImages = design.imageIds
    .map((id) => available.find((a) => a.id === id))
    .filter((x): x is SelectableImage => Boolean(x));
  const ready = selectedImages.length >= needed;
  const canDo3x2 = available.length >= 6;

  const patch = (next: Partial<BackCoverDesign>) =>
    setDesign((d) => ({ ...d, ...next }));

  const apply = async () => {
    setApplying(true);
    setError(null);
    try {
      // Grid images are optional — a color + tagline back cover is valid on
      // its own, so we compose with whatever pages (if any) are selected.
      const dataUrl = await composeBackCover({
        design,
        imageDataUrls: selectedImages.slice(0, needed).map((s) => s.dataUrl),
        aspect,
      });
      onApply({ dataUrl, design });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't build the back cover.",
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 p-4 outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="back-cover-editor-title"
      tabIndex={-1}
      autoFocus
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl p-6 max-h-[94vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-violet-300 font-semibold">
              Back cover editor
            </p>
            <h3
              id="back-cover-editor-title"
              className="text-lg font-bold text-white mt-0.5"
            >
              Design your back cover
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Drag the grid and tagline to position them. Buyers can&apos;t see
              inside on Amazon — show your best pages.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/10 text-neutral-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-[1fr_300px] gap-5">
          <div className="mx-auto w-full max-w-[460px]">
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg">
              <DesignOverlay
                design={design}
                images={selectedImages}
                aspect={aspect}
                onChange={setDesign}
              />
            </div>
            {!ready && (
              <p className="mt-2 text-center text-xs text-amber-300">
                Choose {needed} interior pages to fill the grid.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4 min-w-0">
            <PalettePicker
              frontCoverDataUrl={frontCoverDataUrl}
              value={design.bgColor}
              onChange={(hex) =>
                patch({ bgColor: hex, topStripe: { ...design.topStripe, color: shadeHex(hex) } })
              }
            />

            <div>
              <p className="text-[11px] uppercase tracking-wider text-violet-300 font-semibold mb-1.5">
                Grid
              </p>
              <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
                {(
                  [
                    { value: "2x2", label: "2 × 2", sub: "4 pages" },
                    { value: "3x2", label: "3 × 2", sub: "6 pages" },
                  ] as const
                ).map((opt) => {
                  const active = design.gridSize === opt.value;
                  const disabled = opt.value === "3x2" && !canDo3x2;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => patch({ gridSize: opt.value as GridSize })}
                      title={
                        disabled ? "Needs at least 6 finished pages" : undefined
                      }
                      className={cn(
                        "flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                        active
                          ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow"
                          : "text-neutral-300 hover:bg-white/5",
                      )}
                    >
                      <div>{opt.label}</div>
                      <div
                        className={cn(
                          "text-[10px] font-normal",
                          active ? "text-white/85" : "text-neutral-400",
                        )}
                      >
                        {opt.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/15"
              >
                <Images className="w-3.5 h-3.5" />
                {ready ? `Change pages (${needed})` : `Choose ${needed} pages`}
              </button>
            </div>

            <TaglineGenerator
              bookTitle={bookTitle}
              coverScene={coverScene}
              bookDescription={bookDescription}
              audience={audience}
              pageSubjects={available.map((a) => a.name)}
              pageCount={pageCount}
              bookKind={bookKind}
              value={design.tagline.text}
              onChange={(text) =>
                patch({
                  tagline: { ...design.tagline, text, show: !!text.trim() },
                })
              }
            />

            {design.tagline.show && design.tagline.text.trim() && (
              <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="grid grid-cols-2 gap-1.5">
                  {TAGLINE_FONTS.map((f) => {
                    const active = design.tagline.fontKey === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() =>
                          patch({
                            tagline: {
                              ...design.tagline,
                              fontKey: f.key as FontKey,
                            },
                          })
                        }
                        className={cn(
                          "px-2 py-1.5 rounded-lg text-sm transition-colors truncate",
                          active
                            ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow"
                            : "bg-black/40 text-neutral-200 hover:bg-white/5 border border-white/10",
                        )}
                        style={{
                          fontFamily: f.cssStack,
                          fontStyle: f.italic ? "italic" : "normal",
                          fontWeight: f.weight,
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                <label className="flex items-center gap-2 text-[11px] text-neutral-300">
                  <span className="w-12 shrink-0">Size</span>
                  <input
                    type="range"
                    min={0.7}
                    max={1.6}
                    step={0.05}
                    value={design.tagline.fontScale}
                    onChange={(e) =>
                      patch({
                        tagline: {
                          ...design.tagline,
                          fontScale: Number(e.target.value),
                        },
                      })
                    }
                    className="flex-1 accent-violet-500"
                  />
                </label>
                <label className="flex items-center gap-2 text-[11px] text-neutral-300">
                  <span className="w-12 shrink-0">Width</span>
                  <input
                    type="range"
                    min={0.3}
                    max={0.95}
                    step={0.02}
                    value={design.tagline.width}
                    onChange={(e) =>
                      patch({
                        tagline: {
                          ...design.tagline,
                          width: Number(e.target.value),
                        },
                      })
                    }
                    className="flex-1 accent-violet-500"
                  />
                </label>
                <div className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-[11px] text-neutral-300">
                    Color
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {TAGLINE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          patch({ tagline: { ...design.tagline, color: c } })
                        }
                        className={cn(
                          "w-6 h-6 rounded-md border-2 transition-all",
                          design.tagline.color === c
                            ? "border-violet-400 scale-110"
                            : "border-white/20 hover:border-white/50",
                        )}
                        style={{ backgroundColor: c }}
                        aria-label={`Tagline color ${c}`}
                      />
                    ))}
                    <label className="relative w-6 h-6 rounded-md border-2 border-white/20 overflow-hidden cursor-pointer hover:border-white/50">
                      <input
                        type="color"
                        value={design.tagline.color}
                        onChange={(e) =>
                          patch({
                            tagline: {
                              ...design.tagline,
                              color: e.target.value,
                            },
                          })
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label="Custom tagline color"
                      />
                      <span
                        className="absolute inset-0"
                        style={{ backgroundColor: design.tagline.color }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <label className="flex items-center justify-between text-xs font-semibold text-neutral-200">
                Top stripe
                <input
                  type="checkbox"
                  checked={design.topStripe.show}
                  onChange={(e) =>
                    patch({
                      topStripe: { ...design.topStripe, show: e.target.checked },
                    })
                  }
                  className="accent-violet-500 w-4 h-4"
                />
              </label>
              {design.topStripe.show && (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0.04}
                    max={0.28}
                    step={0.01}
                    value={design.topStripe.height}
                    onChange={(e) =>
                      patch({
                        topStripe: {
                          ...design.topStripe,
                          height: Number(e.target.value),
                        },
                      })
                    }
                    className="flex-1 accent-violet-500"
                    aria-label="Stripe height"
                  />
                  <label className="relative w-7 h-7 rounded-md border border-white/15 overflow-hidden cursor-pointer">
                    <input
                      type="color"
                      value={design.topStripe.color}
                      onChange={(e) =>
                        patch({
                          topStripe: {
                            ...design.topStripe,
                            color: e.target.value,
                          },
                        })
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Stripe color"
                    />
                    <span
                      className="absolute inset-0"
                      style={{ backgroundColor: design.topStripe.color }}
                    />
                  </label>
                </div>
              )}
            </div>

            {error && <p className="text-[11px] text-red-300">{error}</p>}

            <div className="mt-auto flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => void apply()}
                disabled={applying}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-linear-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Apply to back cover
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-neutral-300 hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {pickerOpen && (
        <InteriorImagePicker
          images={available}
          count={needed}
          initialSelectedIds={design.imageIds}
          onClose={() => setPickerOpen(false)}
          onConfirm={(ids) => {
            patch({ imageIds: ids });
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
