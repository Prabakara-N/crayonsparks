"use client";

import { useCallback, useEffect, useState } from "react";
import { Wand2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmin } from "@/lib/hooks/use-admin";
import { PageHeader } from "@/components/account/page-header";
import { type AdminGeneration } from "./generation-row";
import { GenerationCard } from "./generation-card";

type KindFilter = "all" | "coloring" | "story" | "activity";

const KIND_OPTIONS: Array<{ value: KindFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "coloring", label: "Coloring" },
  { value: "story", label: "Story" },
  { value: "activity", label: "Activity" },
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items?.map((it) => (
            <GenerationCard key={it.bookId} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}
