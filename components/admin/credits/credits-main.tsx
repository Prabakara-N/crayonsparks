"use client";

import { useCallback, useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmin } from "@/lib/hooks/use-admin";
import { PageHeader } from "@/components/account/page-header";
import { CreditRow, type AdminCreditEntry } from "./credit-row";
import { RefKindFilter, type RefKindFilter as RefKind } from "./refkind-filter";
import { CreditCsvExportButton } from "./credit-csv-export-button";

export function CreditsMain() {
  const { listCredits } = useAdmin();
  const [items, setItems] = useState<AdminCreditEntry[] | null>(null);
  const [refKind, setRefKind] = useState<RefKind>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(
    async (rk: RefKind) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listCredits({ refKind: rk, limit: 200 });
        setItems(res.items);
      } catch {
        setError(
          "Couldn't load credit ledger. If filtering by kind, the composite index (refKind ASC, createdAt DESC) may not be built yet — check the server log for the auto-generated console link.",
        );
      } finally {
        setLoading(false);
      }
    },
    [listCredits],
  );

  useEffect(() => {
    void fetchCredits(refKind);
  }, [refKind, fetchCredits]);

  return (
    <div>
      <PageHeader
        title="Credits ledger"
        description="Every credit movement across the platform — signups, grants, purchases, spends, refunds."
        actions={
          items ? (
            <CreditCsvExportButton rows={items} filename="credits.csv" />
          ) : null
        }
      />

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <RefKindFilter value={refKind} onChange={setRefKind} />
      </div>

      {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

      {loading && items === null ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-zinc-900/60 border border-white/10 px-4 py-3 flex items-center gap-3"
            >
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
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
          <Coins className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">
            No ledger entries match this filter yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items?.map((entry) => <CreditRow key={entry.id} entry={entry} />)}
        </div>
      )}
    </div>
  );
}
