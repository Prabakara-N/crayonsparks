"use client";

import { useCallback, useEffect, useState } from "react";
import { Wand2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmin } from "@/lib/hooks/use-admin";
import { PageHeader } from "@/components/account/page-header";
import { GenerationRow, type AdminGeneration } from "./generation-row";

type KindFilter = "all" | "coloring" | "story";

const KIND_OPTIONS: Array<{ value: KindFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "coloring", label: "Coloring" },
  { value: "story", label: "Story" },
];

export function GenerationsMain() {
  const { listGenerations } = useAdmin();
  const [items, setItems] = useState<AdminGeneration[] | null>(null);
  const [kind, setKind] = useState<KindFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGenerations = useCallback(
    async (k: KindFilter) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listGenerations({ kind: k, limit: 100 });
        setItems(res.items);
      } catch {
        setError(
          "Couldn't load generations. The query may need a Firestore index — check the server logs for a console link.",
        );
      } finally {
        setLoading(false);
      }
    },
    [listGenerations],
  );

  useEffect(() => {
    void fetchGenerations(kind);
  }, [kind, fetchGenerations]);

  return (
    <div>
      <PageHeader
        title="Generations"
        description="Recent books generated across every account, newest first."
      />

      <div className="flex items-center gap-2 mb-4">
        <div
          role="tablist"
          aria-label="Book kind"
          className="inline-flex p-1 rounded-2xl border border-white/10 bg-zinc-900/60"
        >
          {KIND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={kind === opt.value}
              onClick={() => setKind(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                kind === opt.value
                  ? "bg-amber-500/20 text-amber-100"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

      {loading && items === null ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-zinc-900/60 border border-white/10 px-3 py-3 flex items-center gap-3"
            >
              <Skeleton className="w-12 h-16 rounded-md shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items && items.length === 0 ? (
        <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-8 text-center">
          <Wand2 className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">
            No generations match this filter yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items?.map((it) => (
            <GenerationRow key={it.bookId} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}
