"use client";

import { useRef } from "react";
import { FileUp, Loader2 } from "lucide-react";

interface CoverPdfUploadProps {
  busy: boolean;
  onFile: (file: File) => void;
}

export function CoverPdfUpload({ busy, onFile }: CoverPdfUploadProps) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileUp className="h-3.5 w-3.5" />
        )}
        {busy ? "Reading your book…" : "Upload book PDF — Sparky reads it"}
      </button>
    </div>
  );
}
