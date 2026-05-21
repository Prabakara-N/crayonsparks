"use client";

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
}

interface SavedBookPageGridProps {
  pages: SavedPage[];
  onPageClick: (pageIndex: number) => void;
}

export function SavedBookPageGrid({
  pages,
  onPageClick,
}: SavedBookPageGridProps) {
  if (pages.length === 0) {
    return (
      <p className="text-sm text-neutral-500 text-center py-6 rounded-xl border border-dashed border-white/10">
        No interior pages saved.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {pages.map((page, i) => (
        <button
          key={page.id}
          type="button"
          onClick={() => onPageClick(i)}
          className="rounded-xl bg-zinc-900/60 border border-white/10 hover:border-violet-500/40 overflow-hidden text-left transition-colors"
        >
          <div className="aspect-3/4 bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.image.medium.url}
              alt={page.name}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
          <span className="block px-2 py-1.5 text-[11px] text-neutral-400 truncate">
            {page.index + 1}. {page.name}
          </span>
        </button>
      ))}
    </div>
  );
}
