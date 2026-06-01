"use client";

import Link from "next/link";
import { BookOpen, Sparkles, Palette, PencilRuler } from "lucide-react";

export type SavedBookKind = "coloring" | "story" | "activity";

export interface SavedBookSummary {
  bookId: string;
  title: string;
  coverTitle: string;
  mode: "qa" | "story" | "activity";
  kind: SavedBookKind;
  age: string;
  pageCount: number;
  coverThumbUrl: string | null;
  createdAt: number | null;
}

const KIND_BADGE: Record<SavedBookKind, { label: string; classes: string }> = {
  story: {
    label: "Story",
    classes: "bg-violet-500/20 border border-violet-500/40 text-violet-100",
  },
  activity: {
    label: "Activity",
    classes: "bg-amber-500/20 border border-amber-500/40 text-amber-100",
  },
  coloring: {
    label: "Coloring",
    classes: "bg-cyan-500/20 border border-cyan-500/40 text-cyan-100",
  },
};

function fmtDate(ms: number | null): string {
  if (!ms) return "";
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BookCard({ book }: { book: SavedBookSummary }) {
  const badge = KIND_BADGE[book.kind] ?? KIND_BADGE.coloring;
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
      </div>
      <div className="p-3">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${badge.classes}`}
        >
          {book.kind === "story" ? (
            <Sparkles className="w-3 h-3" />
          ) : book.kind === "activity" ? (
            <PencilRuler className="w-3 h-3" />
          ) : (
            <Palette className="w-3 h-3" />
          )}
          {badge.label}
        </span>
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
