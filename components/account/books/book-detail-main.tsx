"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Loader2,
  Sparkles,
  Palette,
  Trash2,
  LayoutGrid,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useBooks } from "@/lib/hooks/use-books";
import { useDialog } from "@/components/ui/confirm-dialog";
import { BookFlip, prefetchBookFlip } from "@/components/playground/book-flip";
import {
  ImageCarouselModal,
  type CarouselImage,
} from "@/components/ui/image-carousel-modal";
import {
  downloadSavedBook,
  type SavedBookForDownload,
} from "@/lib/functions/client/download-saved-book";
import { PageHeader } from "../page-header";
import { SavedBookPageGrid, type SavedPage } from "./saved-book-page-grid";

interface ImageVariant {
  key: string;
  url: string;
}
interface ImageVariants {
  thumb: ImageVariant;
  medium: ImageVariant;
  full: ImageVariant;
}

interface BookDoc {
  bookId: string;
  mode: "qa" | "story";
  title: string;
  coverTitle: string;
  pageCount: number;
  belongsToStyle?: "bw" | "color";
  cover: ImageVariants;
  backCover: ImageVariants;
  belongsTo?: ImageVariants;
  theEndPage?: ImageVariants;
}

interface CoverTileSpec {
  label: string;
  role: string;
  variants: ImageVariants;
}

export function BookDetailMain({ bookId }: { bookId: string }) {
  const router = useRouter();
  const dialog = useDialog();
  const { get, delete: deleteBook } = useBooks();
  const [book, setBook] = useState<BookDoc | null>(null);
  const [pages, setPages] = useState<SavedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "book">("grid");

  useEffect(() => {
    prefetchBookFlip();
  }, []);

  useEffect(() => {
    get(bookId)
      .then((res) => {
        setBook(res.book as unknown as BookDoc);
        setPages(res.pages as unknown as SavedPage[]);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load book."),
      )
      .finally(() => setLoading(false));
  }, [get, bookId]);

  // Top-of-page tile grid — covers grouped together for quick scanning.
  const coverTiles: CoverTileSpec[] = useMemo(() => {
    if (!book) return [];
    const tiles: CoverTileSpec[] = [
      { label: "Front cover", role: "cover", variants: book.cover },
      { label: "Back cover", role: "backCover", variants: book.backCover },
    ];
    if (book.belongsTo) {
      tiles.push({
        label: "Belongs to",
        role: "belongsTo",
        variants: book.belongsTo,
      });
    }
    if (book.theEndPage) {
      tiles.push({
        label: "The End",
        role: "theEnd",
        variants: book.theEndPage,
      });
    }
    return tiles;
  }, [book]);

  // Carousel — true book READING order:
  //   coloring: front → belongs-to → pages → back
  //   story:    front → pages → the-end → back
  const { carouselImages, indexByRole } = useMemo(() => {
    const images: CarouselImage[] = [];
    const idx = new Map<string, number>();
    const push = (role: string, url: string, label: string) => {
      idx.set(role, images.length);
      images.push({ url, label });
    };
    if (!book) return { carouselImages: images, indexByRole: idx };

    push("cover", book.cover.full.url, "Front cover");
    if (book.mode === "qa" && book.belongsTo) {
      push("belongsTo", book.belongsTo.full.url, "Belongs to");
    }
    for (const p of pages) {
      push(
        `page-${p.id}`,
        p.image.full.url,
        `Page ${p.index + 1} · ${p.name}`,
      );
    }
    if (book.mode === "story" && book.theEndPage) {
      push("theEnd", book.theEndPage.full.url, "The End");
    }
    push("backCover", book.backCover.full.url, "Back cover");

    return { carouselImages: images, indexByRole: idx };
  }, [book, pages]);

  const handleDownload = useCallback(async () => {
    if (!book) return;
    setDownloading(true);
    try {
      await downloadSavedBook(book as SavedBookForDownload, pages);
      toast.success("Print package downloaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  }, [book, pages]);

  const handleDelete = useCallback(async () => {
    if (!book) return;
    const ok = await dialog.confirm({
      title: "Delete this book?",
      message:
        "This removes the book and all its pages from your library. This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Keep",
      variant: "danger",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteBook(book.bookId);
      toast.success("Book deleted.");
      router.replace("/account/books");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
    }
  }, [book, deleteBook, dialog, router]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading book…
      </div>
    );
  }
  if (error || !book) {
    return (
      <div>
        <Link
          href="/account/books"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-3 h-3" /> Back to library
        </Link>
        <p className="text-sm text-red-300">{error ?? "Book not found."}</p>
      </div>
    );
  }

  const isStory = book.mode === "story";

  return (
    <div>
      <Link
        href="/account/books"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> Back to library
      </Link>

      <PageHeader
        title={book.coverTitle || book.title}
        description={`${book.pageCount} pages`}
        actions={
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              isStory
                ? "bg-violet-500/20 border border-violet-500/40 text-violet-100"
                : "bg-cyan-500/20 border border-cyan-500/40 text-cyan-100"
            }`}
          >
            {isStory ? (
              <Sparkles className="w-3 h-3" />
            ) : (
              <Palette className="w-3 h-3" />
            )}
            {isStory ? "Story book" : "Coloring book"}
          </span>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div
          role="tablist"
          aria-label="Book view"
          className="inline-flex p-1 rounded-2xl border border-white/10 bg-zinc-900/60"
        >
          <button
            role="tab"
            aria-selected={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              viewMode === "grid"
                ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow"
                : "text-neutral-300 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Pages
          </button>
          <button
            role="tab"
            aria-selected={viewMode === "book"}
            onClick={() => setViewMode("book")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              viewMode === "book"
                ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow"
                : "text-neutral-300 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Book preview
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-linear-to-r from-violet-500 to-cyan-400 hover:opacity-95 disabled:opacity-60 transition-opacity"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloading
              ? "Building print package…"
              : "Download print package"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={downloading || deleting}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-red-200 bg-red-500/10 hover:bg-red-500/15 border border-red-500/30 disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete
          </button>
        </div>
      </div>

      {viewMode === "book" ? (
        <div className="rounded-3xl p-4 md:p-6 bg-zinc-900/60 border border-white/10 flex flex-col items-center gap-4">
          <p className="text-xs text-neutral-400 text-center">
            Click a page corner or swipe to flip — opens to a 2-page spread
            like a real book.
          </p>
          <BookFlip
            cover={{ imageUrl: book.cover.medium.url }}
            backCover={{ imageUrl: book.backCover.medium.url }}
            belongsTo={
              !isStory && book.belongsTo
                ? { imageUrl: book.belongsTo.medium.url }
                : undefined
            }
            theEndPage={
              isStory && book.theEndPage
                ? { imageUrl: book.theEndPage.medium.url }
                : undefined
            }
            pages={pages.map((p) => ({
              imageUrl: p.image.medium.url,
              label: `${p.name} · Page ${p.index + 1}`,
            }))}
            alternateBlankPages={!isStory}
            fullBleedInterior={isStory}
            width={isStory ? 320 : 360}
            height={480}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {coverTiles.map((tile) => (
              <button
                key={tile.label}
                type="button"
                onClick={() =>
                  setCarouselIndex(indexByRole.get(tile.role) ?? 0)
                }
                className="rounded-xl bg-zinc-900/60 border border-white/10 hover:border-violet-500/40 overflow-hidden text-left transition-colors"
              >
                <div className="aspect-3/4 bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tile.variants.medium.url}
                    alt={tile.label}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="block px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  {tile.label}
                </span>
              </button>
            ))}
          </div>

          <h3 className="font-display text-lg font-semibold text-white mb-3">
            Interior pages
          </h3>
          <SavedBookPageGrid
            pages={pages}
            onPageClick={(pageIndex) => {
              const page = pages[pageIndex];
              if (page) {
                setCarouselIndex(indexByRole.get(`page-${page.id}`) ?? 0);
              }
            }}
          />
        </>
      )}

      <ImageCarouselModal
        open={carouselIndex !== null}
        images={carouselImages}
        startIndex={carouselIndex ?? 0}
        onClose={() => setCarouselIndex(null)}
      />
    </div>
  );
}
