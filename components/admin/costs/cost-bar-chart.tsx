"use client";

export interface CostDay {
  date: string;
  coloring: number;
  story: number;
  total: number;
}

interface CostBarChartProps {
  days: CostDay[];
  peak: number;
  creditUsdRate: number;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function CostBarChart({ days, peak, creditUsdRate }: CostBarChartProps) {
  const safePeak = peak > 0 ? peak : 1;
  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-semibold text-white">
          Daily credit spend (last {days.length} days)
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
        </div>
      </div>

      <div className="flex items-end gap-[2px] h-40">
        {days.map((day) => {
          const total = day.total;
          const heightPct = (total / safePeak) * 100;
          const coloringPct =
            total > 0 ? (day.coloring / total) * heightPct : 0;
          const storyPct = total > 0 ? (day.story / total) * heightPct : 0;
          const usd = (total * creditUsdRate).toFixed(2);
          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1 group relative min-w-0"
              title={`${day.date}: ${total} credits ≈ $${usd}`}
            >
              <div className="w-full flex flex-col-reverse h-full">
                <div
                  className="w-full bg-cyan-400/80 rounded-b-sm"
                  style={{ height: `${coloringPct}%` }}
                />
                <div
                  className="w-full bg-violet-400/80 rounded-t-sm"
                  style={{ height: `${storyPct}%` }}
                />
              </div>
              <span className="absolute -bottom-5 text-[9px] text-neutral-500 whitespace-nowrap rotate-45 origin-left translate-x-1">
                {formatDateLabel(day.date)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-7" aria-hidden />
    </div>
  );
}
