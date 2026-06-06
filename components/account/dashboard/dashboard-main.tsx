"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Coins,
  BookOpen,
  Sparkles,
  Wand2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useUser } from "@/lib/hooks/use-user";
import { useCredits } from "@/lib/hooks/use-credits";
import { useBooks } from "@/lib/hooks/use-books";
import { PageHeader } from "../page-header";

interface RecentBook {
  bookId: string;
  coverTitle: string;
  coverThumbUrl: string | null;
  kind: string;
}

export function DashboardMain() {
  const { user } = useUser();
  const { balance, loading: creditsLoading } = useCredits();
  const { count, list } = useBooks();
  const [booksTotal, setBooksTotal] = useState<number | null>(null);
  const [recent, setRecent] = useState<RecentBook[]>([]);
  const greeting = user?.displayName?.split(" ")[0] || "there";

  useEffect(() => {
    count()
      .then((r) => setBooksTotal(r.total))
      .catch(() => setBooksTotal(0));
    list(4)
      .then((r) => setRecent(r.items as RecentBook[]))
      .catch(() => setRecent([]));
  }, [count, list]);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${greeting}.`}
        description="Your generation activity at a glance."
        actions={
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-linear-to-r from-violet-500 to-cyan-400 hover:opacity-95 transition-opacity"
          >
            <Wand2 className="w-4 h-4" />
            Generate
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={Coins}
          label="Credits balance"
          value={creditsLoading ? "…" : (balance ?? 0)}
          hint="Spent per page generated"
        />
        <StatCard
          icon={BookOpen}
          label="Books generated"
          value={booksTotal === null ? "…" : booksTotal}
          hint="Across coloring + story books"
        />
        <StatCard
          icon={TrendingUp}
          label="Last 30 days"
          value={booksTotal === null ? "…" : booksTotal}
          hint="Books in your library"
        />
      </div>

      <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Recent books
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              {recent.length > 0
                ? "Jump back into a saved book."
                : "Your generated coloring + story books will appear here."}
            </p>
          </div>
          {recent.length === 0 && (
            <Link
              href="/playground"
              className="inline-flex shrink-0 items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-violet-200 border border-violet-400/30 hover:text-white hover:border-violet-400/60 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Start your first book
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {recent.length > 0
            ? recent.slice(0, 4).map((b) => (
                <Link
                  key={b.bookId}
                  href={`/account/books/${b.bookId}`}
                  className="group relative aspect-3/4 rounded-xl bg-zinc-950/60 border border-white/10 overflow-hidden hover:border-violet-400/40 transition-colors"
                >
                  {b.coverThumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.coverThumbUrl}
                      alt={b.coverTitle || "Saved book"}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-neutral-600" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-2">
                    <p className="text-[11px] font-semibold text-white truncate">
                      {b.coverTitle || "Untitled"}
                    </p>
                  </div>
                </Link>
              ))
            : [0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-3/4 rounded-xl bg-linear-to-br from-white/5 to-transparent border border-white/10 flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 text-neutral-600" />
                </div>
              ))}
        </div>
        {recent.length > 0 && (
          <div className="mt-5 text-center">
            <Link
              href="/account/books"
              className="inline-flex items-center gap-2 text-sm font-semibold text-violet-200 hover:text-white"
            >
              See all books
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Coins;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
          {label}
        </span>
        <Icon className="w-4 h-4 text-violet-300" />
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
    </div>
  );
}
