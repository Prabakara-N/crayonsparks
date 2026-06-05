"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import { useCredits } from "@/lib/hooks/use-credits";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCategoryFilter,
  type LedgerCategory,
} from "./credit-category-filter";
import { CreditLedgerRow, type LedgerRowEntry } from "./credit-ledger-row";

const PAGE_SIZE = 15;

export function CreditLedger() {
  const { ledgerPage } = useCredits();
  const [category, setCategory] = useState<LedgerCategory>("all");
  const [page, setPage] = useState(0);
  const [entries, setEntries] = useState<LedgerRowEntry[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (cat: LedgerCategory, p: number) => {
      setEntries(null);
      setError(null);
      try {
        const res = await ledgerPage({
          category: cat,
          page: p,
          pageSize: PAGE_SIZE,
        });
        setEntries(res.entries as LedgerRowEntry[]);
        setTotal(res.total);
      } catch {
        setError("Couldn't load your transactions. Try again shortly.");
      }
    },
    [ledgerPage],
  );

  useEffect(() => {
    void load(category, page);
  }, [category, page, load]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">
            Transactions
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Every grant, purchase, and spend on your account.
          </p>
        </div>
        <Receipt className="w-5 h-5 text-neutral-500" />
      </div>

      <div className="mb-4">
        <CreditCategoryFilter
          value={category}
          onChange={(c) => {
            setPage(0);
            setCategory(c);
          }}
        />
      </div>

      {error && <p className="text-sm text-red-300 mb-3">{error}</p>}

      {entries === null ? (
        <ul className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl bg-black/30 border border-white/5 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
              <Skeleton className="h-4 w-10" />
            </li>
          ))}
        </ul>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-neutral-500">
          No transactions in this category yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <CreditLedgerRow key={e.id} entry={e} />
          ))}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-neutral-500">
            Page {page + 1} of {pageCount} · {total.toLocaleString()} total
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <button
              type="button"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
