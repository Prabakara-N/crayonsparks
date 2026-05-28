"use client";

import { Download, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { downloadImageByKey } from "@/lib/functions/client/download-image-by-key";
import { downloadBakedPage } from "@/lib/functions/client/download-baked-page";
import { BubblePreviewOverlay } from "@/components/playground/book-studio/bubble-editor/bubble-preview-overlay";
import type { StoryBubble } from "@/lib/story-bubble-seed";

interface ImageVariant {
  key: string;
  url: string;
}
interface ImageVariants {
  thumb: ImageVariant;
  medium: ImageVariant;
  full: ImageVariant;
}

export interface SavedPage {
  id: string;
  index: number;
  name: string;
  image: ImageVariants;
  bubbles?: StoryBubble[];
  bubblesFlattened?: boolean;
}

interface SavedBookPageGridProps {
  pages: SavedPage[];
  onPageClick: (pageIndex: number) => void;
  onEditBubbles?: (page: SavedPage) => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function SavedBookPageGrid({
  pages,
  onPageClick,
  onEditBubbles,
}: SavedBookPageGridProps) {
  if (pages.length === 0) {
    return (
      <p className="text-sm text-neutral-500 text-center py-6 rounded-xl border border-dashed border-white/10">
        No interior pages saved.
      </p>
    );
  }

  const handleDownload = async (
    e: React.MouseEvent<HTMLButtonElement>,
    page: SavedPage,
  ) => {
    e.stopPropagation();
    const filename = `page-${page.index + 1}-${slugify(page.name) || "image"}.png`;
    try {
      if (
        page.bubbles &&
        page.bubbles.length > 0 &&
        !page.bubblesFlattened
      ) {
        await downloadBakedPage({
          storageKey: page.image.full.key,
          filename,
          bubbles: page.bubbles,
        });
      } else {
        await downloadImageByKey(page.image.full.key, filename);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed.");
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {pages.map((page, i) => (
        <div
          key={page.id}
          className="group relative rounded-xl bg-zinc-900/60 border border-white/10 hover:border-violet-500/40 overflow-hidden transition-colors"
        >
          <button
            type="button"
            onClick={() => onPageClick(i)}
            className="w-full text-left"
          >
            <div className="aspect-3/4 bg-black/40 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={page.image.medium.url}
                alt={page.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
              {page.bubbles &&
                page.bubbles.length > 0 &&
                !page.bubblesFlattened && (
                  <BubblePreviewOverlay bubbles={page.bubbles} />
                )}
            </div>
            <span className="block px-2 py-1.5 text-[11px] text-neutral-400 truncate">
              {page.index + 1}. {page.name}
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => handleDownload(e, page)}
            aria-label={`Download page ${page.index + 1}`}
            title="Download page"
            className="absolute bottom-9 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm transition-opacity duration-150 hover:bg-black/90 hover:text-violet-200 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100"
          >
            <Download className="h-4 w-4" />
          </button>
          {onEditBubbles &&
            page.bubbles &&
            page.bubbles.length > 0 &&
            !page.bubblesFlattened && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditBubbles(page);
                }}
                aria-label={`Edit ${page.bubbles.length} speech bubbles on page ${page.index + 1}`}
                title="Edit speech bubbles"
                className="absolute bottom-9 right-12 inline-flex h-9 items-center gap-1.5 px-3 rounded-full bg-violet-600/90 text-white text-xs font-semibold shadow-lg backdrop-blur-sm transition-opacity duration-150 hover:bg-violet-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {page.bubbles.length}
              </button>
            )}
        </div>
      ))}
    </div>
  );
}
