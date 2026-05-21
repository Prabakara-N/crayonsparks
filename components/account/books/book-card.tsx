"use client";

import Link from "next/link";
import { BookOpen, Sparkles, Palette } from "lucide-react";

export interface SavedBookSummary {
  bookId: string;
  title: string;
  coverTitle: string;
  mode: "qa" | "story";
  kind: "coloring" | "story";
  age: string;
  pageCount: number;
  coverThumbUrl: string | null;
  createdAt: number | null;
}

function fmtDate(ms: number | null): string {
  if (!ms) return "";
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BookCard({ book }: { book: SavedBookSummary }) {
  const isStory = book.kind === "story";
  return (
    <Link
      href={`/account/books/${book.bookId}`}
      className="group rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-violet-500/40 overflow-hidden transition-colors"
    >
      <div className="relative aspect-3/4 bg-linear-to-br from-white/5 to-transparent">
        {book.coverThumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverThumbUrl}
            alt={book.coverTitle}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-neutral-600" />
          </div>
        )}
        <span
          className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
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
          {isStory ? "Story" : "Coloring"}
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-white truncate group-hover:text-violet-200">
          {book.coverTitle || book.title}
        </p>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          {book.pageCount} {book.pageCount === 1 ? "page" : "pages"}
          {book.createdAt ? ` · ${fmtDate(book.createdAt)}` : ""}
        </p>
      </div>
    </Link>
  );
}
