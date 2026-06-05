"use client";

import { useCallback, useEffect, useState } from "react";
import { orpc } from "@/lib/orpc/client";

interface LedgerEntry {
  id: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  refKind: string;
  createdByEmail: string | null;
  createdAt: number | null;
}

/**
 * Reads the signed-in user's credit balance + ledger via oRPC.
 * `refresh()` re-fetches — call it after a generation or purchase.
 */
export function useCredits(options: { withLedger?: boolean } = {}) {
  const { withLedger = false } = options;
  const [balance, setBalance] = useState<number | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      if (withLedger) {
        const res = await orpc.credits.ledger({ limit: 50 });
        setBalance(res.balance);
        setEntries(res.entries);
      } else {
        const res = await orpc.credits.balance();
        setBalance(res.balance);
      }
    } catch {
      setError("Couldn't load credits.");
    } finally {
      setLoading(false);
    }
  }, [withLedger]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const usage = useCallback(
    (range?: { fromMs?: number; toMs?: number; days?: number }) =>
      orpc.credits.usage(range ?? { days: 30 }),
    [],
  );

  const ledgerPage = useCallback(
    (params: {
      category: "all" | "coloring" | "story" | "activity" | "grant";
      page: number;
      pageSize: number;
    }) => orpc.credits.ledgerPage(params),
    [],
  );

  return { balance, entries, loading, error, refresh, usage, ledgerPage };
}
