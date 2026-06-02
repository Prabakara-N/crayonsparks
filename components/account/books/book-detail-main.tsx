"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Palette,
  PencilRuler,
  LayoutGrid,
  BookOpen,
  Download,
} from "lucide-react";
import { fireConfettiBurst } from "@/components/ui/confetti-burst";
import { downloadImageByKey } from "@/lib/functions/client/download-image-by-key";
import { toast } from "sonner";
import { useBooks } from "@/lib/hooks/use-books";
import { useIsAdmin } from "@/lib/hooks/use-is-admin";
import { useDialog } from "@/components/ui/confirm-dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { BookFlip, prefetchBookFlip } from "@/components/playground/book-flip";
import {
  ImageCarouselModal,
  type CarouselImage,
} from "@/components/ui/image-carousel-modal";
import {
  downloadSavedBook,
  type SavedBookForDownload,
} from "@/lib/functions/client/download-saved-book";
import { downloadSavedBookZip } from "@/lib/functions/client/download-saved-book-zip";
import { PageHeader } from "../page-header";
import { PublishToEtsyButton } from "./publish-to-etsy-button";
import { PublishToPinterestButton } from "./publish-to-pinterest-button";
import { SavedBookPageGrid, type SavedPage } from "./saved-book-page-grid";
import { BookActionsMenu } from "./book-actions-menu";
import { BubbleEditorModal } from "@/components/playground/book-studio/bubble-editor/bubble-editor-modal";
import { applyBubbleStyle } from "@/lib/bubble-style";
import type { StoryBubble } from "@/lib/story-bubble-seed";
import { downloadSavedActivityBook } from "@/lib/functions/client/download-saved-activity-book";

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
  mode: "qa" | "story" | "activity";
  title: string;
  coverTitle: string;
  pageCount: number;
  belongsToStyle?: "bw" | "color";
  cover?: ImageVariants;
  backCover?: ImageVariants;
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
  const { get, delete: deleteBook, updatePageBubbles } = useBooks();
  const { isAdmin } = useIsAdmin();
  const [book, setBook] = useState<BookDoc | null>(null);
  const [pages, setPages] = useState<SavedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "book">("grid");
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null);
  const editingPage = editingBubbleId
    ? pages.find((p) => p.id === editingBubbleId) ?? null
    : null;
  const editingPageIndex = editingPage
    ? pages.findIndex((p) => p.id === editingPage.id)
    : -1;
  const bubbleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (bubbleSaveTimerRef.current) clearTimeout(bubbleSaveTimerRef.current);
    };
  }, []);
  const queueBubbleSave = useCallback(
    (pageId: string, bubbles: StoryBubble[]) => {
      if (bubbleSaveTimerRef.current) clearTimeout(bubbleSaveTimerRef.current);
      bubbleSaveTimerRef.current = setTimeout(() => {
        void updatePageBubbles({ bookId, pageId, bubbles }).catch((err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to save bubbles.",
          );
        });
      }, 600);
    },
    [bookId, updatePageBubbles],
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const enforce = () => {
      if (mq.matches) setViewMode("grid");
    };
    enforce();
    mq.addEventListener("change", enforce);
    return () => mq.removeEventListener("change", enforce);
  }, []);

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
    const tiles: CoverTileSpec[] = [];
    if (book.cover) tiles.push({ label: "Front cover", role: "cover", variants: book.cover });
    if (book.backCover) tiles.push({ label: "Back cover", role: "backCover", variants: book.backCover });
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
    const push = (
      role: string,
      url: string,
      label: string,
      bubbles?: StoryBubble[],
    ) => {
      idx.set(role, images.length);
      images.push({ url, label, bubbles });
    };
    if (!book) return { carouselImages: images, indexByRole: idx };

    if (book.cover) push("cover", book.cover.full.url, "Front cover");
    if (book.mode !== "story" && book.belongsTo) {
      push("belongsTo", book.belongsTo.full.url, "Belongs to");
    }
    for (const p of pages) {
      push(
        `page-${p.id}`,
        p.image.full.url,
        `Page ${p.index + 1} · ${p.name}`,
        !p.bubblesFlattened ? p.bubbles : undefined,
      );
    }
    if (book.mode === "activity") {
      for (const p of pages) {
        if (p.solution) push(`answer-${p.id}`, p.solution.full.url, `Answer — ${p.name}`);
      }
    }
    if (book.mode === "story" && book.theEndPage) {
      push("theEnd", book.theEndPage.full.url, "The End");
    }
    if (book.backCover) push("backCover", book.backCover.full.url, "Back cover");

    return { carouselImages: images, indexByRole: idx };
  }, [book, pages]);

  const downloadActivityPackage = useCallback(
    async (target: "kdp" | "etsy") => {
      if (!book) return;
      setDownloading(true);
      try {
        await downloadSavedActivityBook(
          {
            title: book.title,
            coverTitle: book.coverTitle,
            coverUrl: book.cover?.full.url,
            backCoverUrl: book.backCover?.full.url,
            belongsToUrl: book.belongsTo?.full.url,
            belongsToStyle: book.belongsToStyle,
            pages: pages.map((p) => ({
              id: p.id,
              name: p.name,
              imageUrl: p.image.full.url,
              solutionUrl: p.solution?.full.url,
            })),
            includeAnswerKey: true,
          },
          target,
        );
        toast.success(`${target === "kdp" ? "KDP" : "Etsy"} package downloaded.`);
        fireConfettiBurst(window.innerWidth / 2, window.innerHeight / 2);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Download failed.");
      } finally {
        setDownloading(false);
      }
    },
    [book, pages],
  );

  const handleDownload = useCallback(async () => {
    if (!book) return;
    if (book.mode === "activity") return downloadActivityPackage("kdp");
    setDownloading(true);
    try {
      await downloadSavedBook(book as SavedBookForDownload, pages);
      toast.success("Print package downloaded.");
      fireConfettiBurst(window.innerWidth / 2, window.innerHeight / 2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  }, [book, pages, downloadActivityPackage]);

  const handleDownloadEtsy = useCallback(async () => {
    if (!book) return;
    if (book.mode === "activity") return downloadActivityPackage("etsy");
    setDownloading(true);
    try {
      await downloadSavedBook(book as SavedBookForDownload, pages, "etsy");
      toast.success("Etsy package downloaded.");
      fireConfettiBurst(window.innerWidth / 2, window.innerHeight / 2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  }, [book, pages, downloadActivityPackage]);

  const handleDownloadZip = useCallback(async () => {
    if (!book) return;
    setZipping(true);
    try {
      await downloadSavedBookZip(book as SavedBookForDownload, pages);
      toast.success("ZIP downloaded.");
      fireConfettiBurst(window.innerWidth / 2, window.innerHeight / 2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setZipping(false);
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
    return <LoadingState label="Loading book…" />;
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
  const isActivity = book.mode === "activity";
  // Answer-key pages shown after the activities (Book preview + their own grid).
  const answerPages: SavedPage[] = isActivity
    ? pages
        .filter((p) => p.solution)
        .map((p, i) => ({
          id: `answer-${p.id}`,
          index: i,
          name: `Answer — ${p.name}`,
          image: p.solution as SavedPage["image"],
        }))
    : [];

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
                : isActivity
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-100"
                  : "bg-cyan-500/20 border border-cyan-500/40 text-cyan-100"
            }`}
          >
            {isStory ? (
              <Sparkles className="w-3 h-3" />
            ) : isActivity ? (
              <PencilRuler className="w-3 h-3" />
            ) : (
              <Palette className="w-3 h-3" />
            )}
            {isStory ? "Story book" : isActivity ? "Activity book" : "Coloring book"}
          </span>
        }
      />

      <div className="flex items-center justify-between gap-3 mb-6">
        <div
          role="tablist"
          aria-label="Book view"
          className="hidden md:inline-flex p-1 rounded-2xl border border-white/10 bg-zinc-900/60"
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

        <div className="ml-auto flex items-center">
          <BookActionsMenu
            onDownloadPdf={handleDownload}
            onDownloadZip={handleDownloadZip}
            onDownloadPdfEtsy={handleDownloadEtsy}
            onDelete={handleDelete}
            pdfBuilding={downloading}
            zipBuilding={zipping}
            deleting={deleting}
            extraItems={
              isAdmin ? (
                <div className="px-3.5 py-2 space-y-1.5">
                  <PublishToEtsyButton bookId={book.bookId} />
                  <PublishToPinterestButton bookId={book.bookId} />
                </div>
              ) : undefined
            }
          />
        </div>
      </div>

      {viewMode === "book" ? (
        <div className="rounded-3xl p-4 md:p-6 bg-zinc-900/60 border border-white/10 flex flex-col items-center gap-4">
          <p className="text-xs text-neutral-400 text-center">
            Click a page corner or swipe to flip — opens to a 2-page spread
            like a real book.
          </p>
          <BookFlip
            cover={{ imageUrl: book.cover?.medium.url ?? "" }}
            backCover={{ imageUrl: book.backCover?.medium.url ?? "" }}
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
            pages={[
              ...pages.map((p) => ({
                imageUrl: p.image.medium.url,
                label: `${p.name} · Page ${p.index + 1}`,
                bubbles: !p.bubblesFlattened ? p.bubbles : undefined,
              })),
              ...answerPages.map((a) => ({
                imageUrl: a.image.medium.url,
                label: a.name,
              })),
            ]}
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
              <div
                key={tile.label}
                className="group relative rounded-xl bg-zinc-900/60 border border-white/10 hover:border-violet-500/40 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() =>
                    setCarouselIndex(indexByRole.get(tile.role) ?? 0)
                  }
                  className="w-full text-left"
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
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await downloadImageByKey(
                        tile.variants.full.key,
                        `${tile.role}.png`,
                      );
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Download failed.",
                      );
                    }
                  }}
                  aria-label={`Download ${tile.label}`}
                  title={`Download ${tile.label}`}
                  className="absolute bottom-9 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm transition-opacity duration-150 hover:bg-black/90 hover:text-violet-200 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
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
            onEditBubbles={(p) => setEditingBubbleId(p.id)}
          />

          {answerPages.length > 0 && (
            <>
              <h3 className="font-display text-lg font-semibold text-white mt-8 mb-3">
                Answer key
              </h3>
              <SavedBookPageGrid
                pages={answerPages}
                onPageClick={(pageIndex) => {
                  const a = answerPages[pageIndex];
                  if (a) setCarouselIndex(indexByRole.get(a.id) ?? 0);
                }}
              />
            </>
          )}
        </>
      )}

      <ImageCarouselModal
        open={carouselIndex !== null}
        images={carouselImages}
        startIndex={carouselIndex ?? 0}
        onClose={() => setCarouselIndex(null)}
      />

      {editingPage && (
        <BubbleEditorModal
          open
          onOpenChange={(o) => {
            if (!o) setEditingBubbleId(null);
          }}
          pageName={editingPage.name}
          pageIndex={editingPageIndex}
          totalPages={pages.length}
          imageSrc={editingPage.image.full.url}
          bubbles={editingPage.bubbles ?? []}
          onChange={(next: StoryBubble[]) => {
            setPages((prev) =>
              prev.map((p) =>
                p.id === editingPage.id ? { ...p, bubbles: next } : p,
              ),
            );
            queueBubbleSave(editingPage.id, next);
          }}
          onApplyStyleToBook={(style) => {
            let touchedPages = 0;
            let touchedBubbles = 0;
            setPages((prev) =>
              prev.map((p) => {
                if (!p.bubbles || p.bubbles.length === 0) return p;
                touchedPages += 1;
                touchedBubbles += p.bubbles.length;
                const next = p.bubbles.map((b) => applyBubbleStyle(b, style));
                queueBubbleSave(p.id, next);
                return { ...p, bubbles: next };
              }),
            );
            if (touchedPages > 0) {
              toast.success(
                `Style applied to ${touchedBubbles} bubble${touchedBubbles === 1 ? "" : "s"} across ${touchedPages} page${touchedPages === 1 ? "" : "s"}.`,
              );
            } else {
              toast.info(
                "No other pages have editable bubbles. Pages saved before the bubble editor feature have their bubbles baked into the image — open each page and add bubbles via the editor to make them editable.",
              );
            }
          }}
        />
      )}
    </div>
  );
}
