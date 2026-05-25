"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Search, Wand2 } from "lucide-react";
import { useBooks } from "@/lib/hooks/use-books";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "../page-header";
import { BookCard, type SavedBookSummary } from "./book-card";

type KindFilter = "all" | "coloring" | "story";

export function BooksMain() {
  const { list } = useBooks();
  const [books, setBooks] = useState<SavedBookSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");

  useEffect(() => {
    list(50)
      .then((res) => setBooks(res.items as SavedBookSummary[]))
      .catch(() => setError("Couldn't load your library."));
  }, [list]);

  const filtered = useMemo(() => {
    if (!books) return [];
    const q = search.trim().toLowerCase();
    return books.filter((b) => {
      if (kind !== "all" && b.kind !== kind) return false;
      if (!q) return true;
      return (
        b.coverTitle.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q)
      );
    });
  }, [books, search, kind]);

  return (
    <div>
      <PageHeader
        title="My Books"
        description="Every coloring book and story book you've saved, ready to re-download."
      />

      {books !== null && books.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your books…"
              className="w-full pl-9 pr-3 py-2 rounded-full bg-zinc-900/60 border border-white/10 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-400/40"
            />
          </div>
          <div className="inline-flex p-1 rounded-full bg-zinc-900/60 border border-white/10">
            {(["all", "coloring", "story"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                  kind === k
                    ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      {error ? (
        <div className="rounded-2xl bg-red-500/5 border border-red-500/30 p-6 text-center">
          <p className="text-sm font-semibold text-red-300 mb-1">
            Couldn&apos;t load your library
          </p>
          <p className="text-xs text-red-200/70 mb-4">
            Something went wrong fetching your saved books. Try refreshing.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-white"
          >
            Retry
          </button>
        </div>
      ) : books === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-zinc-900/60 border border-white/10 overflow-hidden"
            >
              <Skeleton className="aspect-3/4 rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <EmptyLibrary />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-8 text-center text-sm text-neutral-400">
          No books match this search.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((b) => (
            <BookCard key={b.bookId} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyLibrary() {
  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-8 md:p-12 text-center">
      <span className="inline-flex w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 items-center justify-center mb-4">
        <BookOpen className="w-6 h-6 text-violet-200" />
      </span>
      <h3 className="font-display text-xl font-semibold text-white">
        Your library is empty
      </h3>
      <p className="mt-2 text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
        Generate a book in the playground, then click{" "}
        <span className="font-semibold text-violet-200">Save to library</span>{" "}
        — it lands here with covers, interior pages, and download bundles.
      </p>
      <Link
        href="/playground"
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow-md shadow-violet-500/30 hover:opacity-95 transition-opacity"
      >
        <Wand2 className="w-4 h-4" />
        Generate your first book
      </Link>
    </div>
  );
}
