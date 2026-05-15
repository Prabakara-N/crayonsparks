"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { ACCEPTED_REFERENCE_TYPES } from "./guided-chat-constants";

interface ReferenceAttachmentProps {
  reference: string | null;
  referenceError: string | null;
  onUpload: (file: File) => void;
  onPreview: () => void;
  onRemove: () => void;
}

export function ReferenceAttachment({
  reference,
  referenceError,
  onUpload,
  onPreview,
  onRemove,
}: ReferenceAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-white/10 bg-black/40 text-neutral-300 hover:bg-white/5 hover:text-white transition-colors"
          title="Attach a reference image — Sparky will use its style"
        >
          <ImagePlus className="w-3 h-3" />
          {reference ? "Change reference" : "Attach reference"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_REFERENCE_TYPES.join(",")}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
        {reference && (
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={onPreview}
              title="Click to view full size"
              className="shrink-0 group relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reference}
                alt="Reference attached — click to expand"
                className="w-7 h-7 rounded object-cover ring-1 ring-violet-500/40 group-hover:ring-2 group-hover:ring-violet-400 transition-all"
              />
              <span className="absolute inset-0 rounded bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] font-bold text-white">
                VIEW
              </span>
            </button>
            <button
              type="button"
              onClick={onPreview}
              className="text-[11px] text-violet-300 font-medium truncate hover:text-violet-200 hover:underline"
            >
              Reference attached
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-0.5 rounded hover:bg-white/10 text-neutral-400 hover:text-red-300"
              title="Remove reference"
              aria-label="Remove reference"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {referenceError && (
        <span className="text-[10px] text-red-300">{referenceError}</span>
      )}
    </div>
  );
}
