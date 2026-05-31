"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  extractCoverPalette,
  type PaletteSwatch,
} from "@/lib/extract-cover-palette";
import { cn } from "@/lib/utils";

interface PalettePickerProps {
  frontCoverDataUrl?: string;
  value: string;
  onChange: (hex: string) => void;
}

export function PalettePicker({
  frontCoverDataUrl,
  value,
  onChange,
}: PalettePickerProps) {
  const [swatches, setSwatches] = useState<PaletteSwatch[]>([]);
  const [loading, setLoading] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!frontCoverDataUrl) return;
    let cancelled = false;
    setLoading(true);
    extractCoverPalette(frontCoverDataUrl)
      .then((s) => {
        if (!cancelled) setSwatches(s);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [frontCoverDataUrl]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] uppercase tracking-wider text-violet-300 font-semibold">
        Background color (from front cover)
      </p>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Extracting palette…
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {swatches.map((s) => (
            <button
              key={s.hex}
              type="button"
              onClick={() => onChange(s.cssColor)}
              className={cn(
                "w-8 h-8 rounded-lg border-2 transition-all",
                value === s.cssColor
                  ? "border-white shadow-lg scale-110"
                  : "border-white/15 hover:border-white/40",
              )}
              style={{ backgroundColor: s.cssColor }}
              title={s.hueName}
              aria-label={`Background color: ${s.hueName}`}
            />
          ))}
          <label className="relative w-8 h-8 rounded-lg border-2 border-white/15 overflow-hidden cursor-pointer hover:border-white/40">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
              aria-label="Custom background color"
            />
            <span
              className="absolute inset-0"
              style={{ backgroundColor: value }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
