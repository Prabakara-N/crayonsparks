"use client";

import type { FrontTextModel, FrontTextField } from "./cover-types";

interface CoverFrontOverlayControlsProps {
  value: FrontTextModel;
  onChange: (next: FrontTextModel) => void;
}

const FIELDS: { key: keyof FrontTextModel; label: string; placeholder: string }[] = [
  { key: "title", label: "Title", placeholder: "The Midnight Garden" },
  { key: "tagline", label: "Selling words / tagline", placeholder: "100 enchanting designs" },
  { key: "author", label: "Author / Made by", placeholder: "by Jane Doe" },
  { key: "pages", label: "Page-count badge", placeholder: "120 PAGES" },
];

export function CoverFrontOverlayControls({
  value,
  onChange,
}: CoverFrontOverlayControlsProps) {
  const setField = (key: keyof FrontTextModel, patch: Partial<FrontTextField>) => {
    const field = value[key] as FrontTextField;
    onChange({ ...value, [key]: { ...field, ...patch } });
  };

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium text-neutral-300">
        Add text (optional — drawn cleanly over the art)
      </p>
      {FIELDS.map((f) => {
        const field = value[f.key] as FrontTextField;
        return (
          <div key={f.key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.on}
              onChange={(e) => setField(f.key, { on: e.target.checked })}
              className="h-4 w-4 shrink-0 accent-violet-500"
              aria-label={`Show ${f.label}`}
            />
            <input
              type="text"
              value={field.text}
              onChange={(e) => setField(f.key, { text: e.target.value, on: true })}
              placeholder={f.label + " — " + f.placeholder}
              className="h-9 flex-1 rounded-lg border border-white/10 bg-black/50 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/60 disabled:opacity-50"
              disabled={!field.on}
            />
          </div>
        );
      })}

      <div className="flex items-center gap-4 pt-1">
        <label className="flex items-center gap-2 text-xs text-neutral-300">
          Title position
          <select
            value={value.titlePos}
            onChange={(e) =>
              onChange({ ...value, titlePos: e.target.value as "top" | "bottom" })
            }
            className="h-8 rounded-md border border-white/10 bg-black/50 px-2 text-xs text-white focus:outline-none"
          >
            <option value="bottom">Bottom</option>
            <option value="top">Top</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-neutral-300">
          Text color
          <input
            type="color"
            value={value.color}
            onChange={(e) => onChange({ ...value, color: e.target.value })}
            className="h-7 w-9 rounded border border-white/10 bg-transparent"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-neutral-300">
          <input
            type="checkbox"
            checked={value.band}
            onChange={(e) => onChange({ ...value, band: e.target.checked })}
            className="h-4 w-4 accent-violet-500"
          />
          Shade behind text
        </label>
      </div>
    </div>
  );
}
