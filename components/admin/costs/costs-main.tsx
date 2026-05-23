"use client";

import { useEffect, useState } from "react";
import { Activity, BookOpen, DollarSign, Palette } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmin } from "@/lib/hooks/use-admin";
import { PageHeader } from "@/components/account/page-header";
import { CostSummaryCard } from "./cost-summary-card";
import { CostBarChart, type CostDay } from "./cost-bar-chart";

interface CostsData {
  days: CostDay[];
  totalCredits: number;
  peakCredits: number;
  creditUsdRate: number;
}

export function CostsMain() {
  const { dailyCosts } = useAdmin();
  const [data, setData] = useState<CostsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    dailyCosts(30)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Couldn't load cost data. The credits collection-group index (refKind=spend, createdAt DESC) may not be built yet — check the server log for the auto-generated console link.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dailyCosts]);

  const coloringTotal = data?.days.reduce((n, d) => n + d.coloring, 0) ?? 0;
  const storyTotal = data?.days.reduce((n, d) => n + d.story, 0) ?? 0;
  const totalUsd =
    data ? (data.totalCredits * data.creditUsdRate).toFixed(2) : "0.00";

  return (
    <div>
      <PageHeader
        title="Cost monitor"
        description="Estimated daily credit spend across the platform. Multiply by the credit/USD rate for a rough provider-cost estimate."
      />

      {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

      {!data && !error ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-56 rounded-2xl" />
        </>
      ) : (
        data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <CostSummaryCard
                icon={DollarSign}
                label="Est. spend (30d)"
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
            </div>

            <CostBarChart
              days={data.days}
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
