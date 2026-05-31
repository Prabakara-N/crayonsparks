"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectableImage } from "./back-cover-grid-types";

interface InteriorImagePickerProps {
  images: SelectableImage[];
  initialSelectedIds: string[];
  count?: number;
  onConfirm: (ids: string[]) => void;
  onClose: () => void;
}

export function InteriorImagePicker({
  images,
  initialSelectedIds,
  count = 4,
  onConfirm,
  onClose,
}: InteriorImagePickerProps) {
  const MAX = count;
  const [selected, setSelected] = useState<string[]>(
    initialSelectedIds.slice(0, MAX),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX) return prev;
      return [...prev, id];
    });
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4 outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="back-cover-picker-title"
      tabIndex={-1}
      autoFocus
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-violet-300 font-semibold">
              Back cover preview
            </p>
            <h3
              id="back-cover-picker-title"
              className="text-lg font-bold text-white mt-0.5"
            >
              Pick {MAX} interior pages
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Tap to select — the numbers show the 2×2 grid order. Buyers can&apos;t
              see inside on Amazon, so show your best pages.
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

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img) => {
            const order = selected.indexOf(img.id);
            const active = order !== -1;
            const atLimit = selected.length >= MAX && !active;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => toggle(img.id)}
                disabled={atLimit}
                className={cn(
                  "relative aspect-3/4 rounded-lg overflow-hidden border-2 transition-all",
                  active
                    ? "border-violet-400 ring-2 ring-violet-400/40"
                    : "border-white/10 hover:border-white/30",
                  atLimit && "opacity-40 cursor-not-allowed",
                )}
                title={img.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {active && (
                  <span className="absolute top-1 left-1 w-6 h-6 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center shadow">
                    {order + 1}
                  </span>
                )}
                <span className="absolute bottom-0 inset-x-0 px-1.5 py-1 text-[10px] text-white/90 bg-black/50 truncate text-left">
                  {img.index + 1}. {img.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-400">
            {selected.length}/{MAX} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-neutral-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(selected)}
              disabled={selected.length !== MAX}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Use these {MAX}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
