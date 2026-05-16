"use client";

import Link from "next/link";
import { BookOpen, Search, Filter, Sparkles, Wand2 } from "lucide-react";
import { PageHeader } from "../page-header";
import { ComingSoonTag } from "../coming-soon-tag";

export function BooksMain() {
  return (
    <div>
      <PageHeader
        title="My Books"
        description="Every coloring book and story book you've generated, ready to download and republish."
        actions={<ComingSoonTag />}
      />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="search"
            placeholder="Search your books…"
            disabled
            className="w-full pl-9 pr-3 py-2 rounded-full bg-zinc-900/60 border border-white/10 text-sm text-white placeholder:text-neutral-500 disabled:opacity-60 focus:outline-none focus:border-violet-400/40"
          />
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-zinc-900/60 border border-white/10 text-sm text-neutral-300 disabled:opacity-60"
        >
          <Filter className="w-4 h-4" />
          All types
        </button>
      </div>

      <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-8 md:p-12 text-center">
        <span className="inline-flex w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 items-center justify-center mb-4">
          <BookOpen className="w-6 h-6 text-violet-200" />
        </span>
        <h3 className="font-display text-xl font-semibold text-white">
          Your library is empty
        </h3>
        <p className="mt-2 text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
          Once you generate your first book, it will land here with covers,
          interior pages, KDP metadata, and one-click download bundles.
        </p>
        <Link
          href="/playground"
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow-md shadow-violet-500/30 hover:opacity-95 transition-opacity"
        >
          <Wand2 className="w-4 h-4" />
          Generate your first book
        </Link>
        <p className="mt-4 text-[11px] text-neutral-500 inline-flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Library auto-saves your generations — coming with credits launch.
        </p>
      </div>
    </div>
  );
}
