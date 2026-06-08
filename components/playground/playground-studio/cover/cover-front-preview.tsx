"use client";

import type { CSSProperties } from "react";
import type { FrontTextModel } from "./cover-types";

interface CoverFrontPreviewProps {
  art: string;
  text: FrontTextModel;
  aspect: string;
}

// Live CSS approximation of composeFrontCover() — container-query units (cqw)
// keep the overlay text scaled to whatever width the preview renders at.
export function CoverFrontPreview({ art, text, aspect }: CoverFrontPreviewProps) {
  const showTitleBlock =
    (text.title.on && text.title.text.trim()) ||
    (text.tagline.on && text.tagline.text.trim());
  const bandStyle: CSSProperties = text.band
    ? { background: "rgba(0,0,0,0.38)" }
    : {};

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-neutral-900"
      style={{ aspectRatio: aspect, containerType: "inline-size" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover" />

      {showTitleBlock && (
        <div
          className="absolute inset-x-0 px-[7cqw] py-[3cqw] text-center"
          style={{ ...bandStyle, [text.titlePos]: 0, color: text.color }}
        >
          {text.title.on && text.title.text.trim() && (
            <div
              className="font-serif font-bold leading-tight"
              style={{ fontSize: "10cqw" }}
            >
              {text.title.text}
            </div>
          )}
          {text.tagline.on && text.tagline.text.trim() && (
            <div className="font-serif" style={{ fontSize: "4.5cqw", marginTop: "1.5cqw" }}>
              {text.tagline.text}
            </div>
          )}
        </div>
      )}

      {text.author.on && text.author.text.trim() && (
        <div
          className="absolute inset-x-0 bottom-0 px-[7cqw] py-[1.5cqw] text-center font-serif font-semibold"
          style={{ ...bandStyle, color: text.color, fontSize: "4cqw" }}
        >
          {text.author.text}
        </div>
      )}

      {text.pages.on && text.pages.text.trim() && (
        <div
          className="absolute right-[2cqw] top-[2cqw] rounded-full bg-black/55 px-[3cqw] py-[1cqw] font-serif font-bold text-white"
          style={{ fontSize: "3.2cqw" }}
        >
          {text.pages.text}
        </div>
      )}
    </div>
  );
}
