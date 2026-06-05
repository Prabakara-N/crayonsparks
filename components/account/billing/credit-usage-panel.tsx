"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useBilling } from "@/lib/hooks/use-billing";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CostBarChart,
  type CostBucket,
  type CostUnit,
} from "@/components/admin/costs/cost-bar-chart";
import { CostRangePicker } from "@/components/admin/costs/cost-range-picker";
import type { CostRangeId } from "@/components/admin/costs/cost-range-config";
import { UsageStat } from "./usage-stat";

interface UsageData {
  buckets: CostBucket[];
  unit: CostUnit;
  totalCredits: number;
  peakCredits: number;
}

const DAY = 24 * 60 * 60 * 1000;

export function CreditUsagePanel() {
  const { usage } = useBilling();
  const [data, setData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rangeId, setRangeId] = useState<CostRangeId>("30d");
  const [range, setRange] = useState<{ fromMs: number; toMs: number }>(() => {
    const now = Date.now();
    return { fromMs: now - 30 * DAY, toMs: now };
  });

  const load = useCallback(
    async (fromMs: number, toMs: number) => {
      setData(null);
      setError(null);
      try {
        const res = await usage({ fromMs, toMs });
        setData(res);
      } catch {
        setError("Couldn't load your usage right now. Try again shortly.");
      }
    },
    [usage],
  );

  useEffect(() => {
    void load(range.fromMs, range.toMs);
  }, [range, load]);

  const coloring = data?.buckets.reduce((n, d) => n + d.coloring, 0) ?? 0;
  const story = data?.buckets.reduce((n, d) => n + d.story, 0) ?? 0;
  const activity = data?.buckets.reduce((n, d) => n + d.activity, 0) ?? 0;

  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">
            Credit usage
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Where your credits went, by book type.
          </p>
        </div>
        <TrendingUp className="w-5 h-5 text-neutral-500" />
      </div>

      <CostRangePicker
        selected={rangeId}
        onChange={(id, fromMs, toMs) => {
          setRangeId(id);
          setRange({ fromMs, toMs });
        }}
      />

      {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

      {!data && !error ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </>
      ) : (
        data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <UsageStat label="Total spent" value={data.totalCredits} tone="white" />
              <UsageStat label="Coloring" value={coloring} tone="cyan" />
              <UsageStat label="Story" value={story} tone="violet" />
              <UsageStat label="Activity" value={activity} tone="amber" />
            </div>

            {data.totalCredits === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-neutral-500">
                No credit usage in this range yet.
              </div>
            ) : (
              <CostBarChart
                buckets={data.buckets}
                unit={data.unit}
                peak={data.peakCredits}
              />
            )}
          </>
        )
      )}
    </div>
  );
}
