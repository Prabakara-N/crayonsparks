"use client";

export interface CostBucket {
  t: number;
  coloring: number;
  story: number;
  activity: number;
  total: number;
}

export type CostUnit = "hour" | "day" | "week";

interface CostBarChartProps {
  buckets: CostBucket[];
  unit: CostUnit;
  peak: number;
  creditUsdRate?: number;
}

function formatLabel(t: number, unit: CostUnit): string {
  const d = new Date(t);
  if (unit === "hour")
    return d.toLocaleTimeString(undefined, { hour: "numeric" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTooltip(t: number, unit: CostUnit): string {
  const d = new Date(t);
  if (unit === "hour")
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
    });
  if (unit === "week") return `Week of ${formatLabel(t, "day")}`;
  return formatLabel(t, "day");
}

const RANGE_TITLE: Record<CostUnit, string> = {
  hour: "Hourly credit spend",
  day: "Daily credit spend",
  week: "Weekly credit spend",
};

export function CostBarChart({
  buckets,
  unit,
  peak,
  creditUsdRate,
}: CostBarChartProps) {
  const safePeak = peak > 0 ? peak : 1;
  const labelEvery = Math.max(1, Math.ceil(buckets.length / 12));
  const colWidth = unit === "hour" ? 18 : 16;
  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="font-display text-sm sm:text-base font-semibold text-white">
          {RANGE_TITLE[unit]}
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Coloring
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            Story
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Activity
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: buckets.length * colWidth }}>
          <div className="flex items-end gap-[3px] h-40">
            {buckets.map((b) => {
              const heightPct = (b.total / safePeak) * 100;
              const coloringPct =
                b.total > 0 ? (b.coloring / b.total) * heightPct : 0;
              const storyPct = b.total > 0 ? (b.story / b.total) * heightPct : 0;
              const activityPct =
                b.total > 0 ? (b.activity / b.total) * heightPct : 0;
              const usd =
                creditUsdRate != null
                  ? ` ≈ $${(b.total * creditUsdRate).toFixed(2)}`
                  : "";
              return (
                <div
                  key={b.t}
                  className="flex-1 h-full flex flex-col-reverse min-w-0"
                  title={`${formatTooltip(b.t, unit)}: ${b.total} credits${usd}`}
                >
                  <div
                    className="w-full bg-cyan-400/80 rounded-b-sm"
                    style={{ height: `${coloringPct}%` }}
                  />
                  <div
                    className="w-full bg-violet-400/80"
                    style={{ height: `${storyPct}%` }}
                  />
                  <div
                    className="w-full bg-amber-400/80 rounded-t-sm"
                    style={{ height: `${activityPct}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-[3px] mt-2">
            {buckets.map((b, i) => (
              <div key={b.t} className="flex-1 min-w-0 text-center">
                {i % labelEvery === 0 && (
                  <span className="text-[9px] text-neutral-500 whitespace-nowrap">
                    {formatLabel(b.t, unit)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
