"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageVariant {
  url: string;
}
interface ImageVariants {
  full: ImageVariant;
  medium: ImageVariant;
  thumb: ImageVariant;
}
interface ActivityBook {
  bookId: string;
  title: string;
  coverTitle: string;
  pageCount: number;
  cover?: ImageVariants;
}
interface ActivitySavedPage {
  id: string;
  name: string;
  image: ImageVariants;
  solution?: ImageVariants;
  activity?: { type?: string; difficulty?: string };
}

interface ActivityBookDetailProps {
  book: ActivityBook;
  pages: ActivitySavedPage[];
  onDelete: () => void;
  deleting: boolean;
}

export function ActivityBookDetail({ book, pages, onDelete, deleting }: ActivityBookDetailProps) {
  const [showAnswers, setShowAnswers] = useState(false);
  const hasAnswers = pages.some((p) => p.solution?.full?.url);

  return (
    <div>
      <Link
        href="/account/books"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> Back to library
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-4 min-w-0">
          {book.cover?.full?.url && (
            <div className="w-20 shrink-0 overflow-hidden rounded-lg border border-white/10" style={{ aspectRatio: "3 / 4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={book.cover.full.url} alt="Cover" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">Activity book</p>
            <h1 className="text-xl font-bold text-white leading-tight">{book.coverTitle || book.title}</h1>
            <p className="text-xs text-neutral-400 mt-1">{pages.length} activities</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasAnswers && (
            <button
              type="button"
              onClick={() => setShowAnswers((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border",
                showAnswers ? "bg-rose-500/20 text-rose-200 border-rose-400/40" : "text-neutral-300 border-white/15 hover:bg-white/5",
              )}
            >
              {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAnswers ? "Hide answers" : "Show answers"}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-red-500/15 text-red-200 hover:bg-red-500/25 border border-red-500/30 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {pages.map((p, i) => {
          const src = showAnswers && p.solution?.full?.url ? p.solution.full.url : p.image.full.url;
          return (
            <a
              key={p.id}
              href={src}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden hover:border-violet-400/50 transition-colors"
            >
              <div className="relative bg-white" style={{ aspectRatio: "85 / 110" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={p.name} className="absolute inset-0 w-full h-full object-contain" />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white border border-white/15">
                  {i + 1} · {p.activity?.type ?? p.name}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
