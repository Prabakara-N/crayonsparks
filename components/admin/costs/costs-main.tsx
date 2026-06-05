"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, BookOpen, DollarSign, Palette, PencilRuler } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmin } from "@/lib/hooks/use-admin";
import { PageHeader } from "@/components/account/page-header";
import { CostSummaryCard } from "./cost-summary-card";
import { CostBarChart, type CostBucket, type CostUnit } from "./cost-bar-chart";
import { CostRangePicker } from "./cost-range-picker";
import type { CostRangeId } from "./cost-range-config";

interface CostsData {
  buckets: CostBucket[];
  unit: CostUnit;
  totalCredits: number;
  peakCredits: number;
  creditUsdRate: number;
}

const DAY = 24 * 60 * 60 * 1000;

export function CostsMain() {
  const { dailyCosts } = useAdmin();
  const [data, setData] = useState<CostsData | null>(null);
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
        const res = await dailyCosts({ fromMs, toMs });
        setData(res);
      } catch {
        setError(
          "Couldn't load cost data. The credits collection-group index (refKind=spend, createdAt DESC) may not be built yet — check the server log for the auto-generated console link.",
        );
      }
    },
    [dailyCosts],
  );

  useEffect(() => {
    void load(range.fromMs, range.toMs);
  }, [range, load]);

  const coloringTotal = data?.buckets.reduce((n, d) => n + d.coloring, 0) ?? 0;
  const storyTotal = data?.buckets.reduce((n, d) => n + d.story, 0) ?? 0;
  const activityTotal = data?.buckets.reduce((n, d) => n + d.activity, 0) ?? 0;
  const totalUsd =
    data ? (data.totalCredits * data.creditUsdRate).toFixed(2) : "0.00";

  return (
    <div>
      <PageHeader
        title="Cost monitor"
        description="Estimated credit spend across the platform. Multiply by the credit/USD rate for a rough provider-cost estimate."
      />

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-56 rounded-2xl" />
        </>
      ) : (
        data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <CostSummaryCard
                icon={DollarSign}
                label="Est. spend"
                value={`$${totalUsd}`}
                subtext={`${data.totalCredits.toLocaleString()} credits @ $${data.creditUsdRate}/credit (estimated)`}
                tone="amber"
              />
              <CostSummaryCard
                icon={Palette}
                label="Coloring spend"
                value={`${coloringTotal.toLocaleString()} cr`}
                subtext="Total credits spent on coloring books"
                tone="cyan"
              />
              <CostSummaryCard
                icon={BookOpen}
                label="Story spend"
                value={`${storyTotal.toLocaleString()} cr`}
                subtext="Total credits spent on story books"
                tone="violet"
              />
              <CostSummaryCard
                icon={PencilRuler}
                label="Activity spend"
                value={`${activityTotal.toLocaleString()} cr`}
                subtext="Total credits spent on activity books"
                tone="amber"
              />
            </div>

            <CostBarChart
              buckets={data.buckets}
              unit={data.unit}
              peak={data.peakCredits}
              creditUsdRate={data.creditUsdRate}
            />

            <p className="mt-4 text-[11px] text-neutral-500 leading-relaxed">
              <Activity className="inline w-3 h-3 mr-1 align-text-bottom" />
              All $ figures are estimates derived from credit ledger spends.
              The source of truth is your provider billing dashboard
              (Gemini, OpenAI, Perplexity). Use this view for anomaly
              detection, not accounting.
            </p>
          </>
        )
      )}
    </div>
  );
}
