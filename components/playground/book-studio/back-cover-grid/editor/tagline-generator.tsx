"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";

interface TaglineGeneratorProps {
  bookTitle: string;
  coverScene?: string;
  bookDescription?: string;
  audience?: string;
  pageSubjects?: string[];
  pageCount?: number;
  bookKind: "coloring" | "story";
  value: string;
  onChange: (text: string) => void;
}

export function TaglineGenerator({
  bookTitle,
  coverScene,
  bookDescription,
  audience,
  pageSubjects,
  pageCount,
  bookKind,
  value,
  onChange,
}: TaglineGeneratorProps) {
  const [taglines, setTaglines] = useState<string[]>([]);
  const [seed, setSeed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const fetchTaglines = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/back-cover-tagline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookTitle,
        coverScene,
        bookDescription,
        audience,
        pageSubjects,
        pageCount,
        variantSeed: seed,
        bookKind,
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as
          | { taglines: string[] }
          | { error: string };
        if (!res.ok || "error" in data) {
          throw new Error(
            "error" in data ? data.error : "Tagline fetch failed.",
          );
        }
        if (cancelled) return;
        setTaglines(data.taglines);
        setIndex(0);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Could not fetch taglines.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    bookTitle,
    coverScene,
    bookDescription,
    audience,
    pageSubjects,
    pageCount,
    seed,
    bookKind,
  ]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (seed === 0) return;
    return fetchTaglines();
  }, [seed, fetchTaglines]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const safeIndex = taglines.length ? Math.min(index, taglines.length - 1) : 0;
  const current = taglines[safeIndex];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-violet-300 font-semibold">
          Tagline
        </p>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          disabled={loading}
          className="inline-flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white px-2 py-0.5 rounded hover:bg-white/5 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          {loading
            ? "Generating…"
            : taglines.length === 0
              ? "Generate"
              : "Suggest more"}
        </button>
      </div>

      {error && <p className="text-[11px] text-red-300">{error}</p>}

      {current && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              setIndex((i) => (i - 1 + taglines.length) % taglines.length)
            }
            disabled={taglines.length < 2}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
            aria-label="Previous tagline"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChange(current)}
            className="flex-1 text-left px-2.5 py-1.5 rounded-lg text-[11px] leading-snug bg-black/30 border border-white/10 text-neutral-200 hover:border-violet-400 hover:text-white italic break-words"
          >
            {`"${current}"`} — tap to use
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % taglines.length)}
            disabled={taglines.length < 2}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
            aria-label="Next tagline"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a tagline, or generate one above"
        className="w-full px-2.5 py-1.5 rounded-lg text-[11px] bg-black/40 border border-white/10 text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-400"
      />
    </div>
  );
}
