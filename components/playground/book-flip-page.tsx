"use client";

import { forwardRef } from "react";
import { BubblePreviewOverlay } from "./book-studio/bubble-editor/bubble-preview-overlay";
import type { StoryBubble } from "./book-studio/types";

export interface BookFlipPageProps {
  imageUrl?: string;
  label?: string;
  showBorder?: boolean;
  variant?: "cover" | "interior" | "blank";
  pageNumber?: number;
  brandMark?: boolean;
  fullBleed?: boolean;
  bubbles?: StoryBubble[];
}

/**
 * One physical "page" in the page-flip book. forwardRef is required by
 * react-pageflip — it injects a ref into each child to drive the flip.
 */
export const BookFlipPage = forwardRef<HTMLDivElement, BookFlipPageProps>(
  function BookFlipPage(
    {
      imageUrl,
      label,
      showBorder = true,
      variant = "interior",
      pageNumber,
      brandMark = false,
      fullBleed = false,
      bubbles,
    },
    ref,
  ) {
    if (variant === "blank") {
      return (
        <div
          ref={ref}
          className="bg-white flex items-center justify-center text-neutral-300 text-xs italic"
        >
          (blank)
        </div>
      );
    }

    const fit =
      variant === "cover" || fullBleed ? "object-cover" : "object-contain";

    return (
      <div ref={ref} className="bg-white relative overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={label ?? ""}
            className={`absolute inset-0 w-full h-full ${fit}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
            Not generated yet
          </div>
        )}
        {imageUrl && bubbles && bubbles.length > 0 && (
          <BubblePreviewOverlay bubbles={bubbles} />
        )}
        {/* Border is drawn by Gemini directly into the interior page
            image now (per master prompt's DRAW_BORDER_RULE) so the
            on-screen ColoringBorder overlay would create a double border.
            Page numbers are skipped on full-bleed pages — story books
            run art edge-to-edge so a numeric overlay sits on top of the
            illustration and looks broken. */}
        {pageNumber !== undefined && !fullBleed && (
          <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-neutral-500 font-mono">
            {pageNumber}
          </div>
        )}
        {brandMark && (
          <div className="absolute bottom-1.5 left-0 right-0 text-center text-[9px] tracking-wide text-neutral-700 font-semibold pointer-events-none select-none">
            CrayonSparks{" "}
            <span aria-hidden className="text-neutral-500">
              ✦
            </span>
          </div>
        )}
      </div>
    );
  },
);
