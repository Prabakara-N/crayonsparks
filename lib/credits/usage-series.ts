export type UsageUnit = "hour" | "day" | "week";

export interface UsageBucket {
  t: number;
  coloring: number;
  story: number;
  activity: number;
  total: number;
}

export interface UsageSpend {
  at: number;
  delta: number;
  reason: string;
}

export interface UsageSeries {
  buckets: UsageBucket[];
  unit: UsageUnit;
  fromMs: number;
  toMs: number;
  totalCredits: number;
  peakCredits: number;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Buckets credit spends into hour/day/week slots based on the range span, and
// splits each spend into coloring / story / activity by its ledger reason text.
// Shared by the admin cost monitor (all users) and the per-user usage tracker.
export function buildUsageSeries(
  spends: UsageSpend[],
  fromMs: number,
  toMs: number,
): UsageSeries {
  const lo = Math.min(fromMs, toMs);
  const hi = Math.max(fromMs, toMs);
  const span = hi - lo;
  const unit: UsageUnit =
    span <= 2 * DAY ? "hour" : span <= 45 * DAY ? "day" : "week";
  const step = unit === "hour" ? HOUR : unit === "day" ? DAY : 7 * DAY;

  const bucketStart = (t: number): number => {
    if (unit === "hour") return Math.floor(t / HOUR) * HOUR;
    const dayStart = Math.floor(t / DAY) * DAY;
    if (unit === "day") return dayStart;
    return dayStart - new Date(dayStart).getUTCDay() * DAY;
  };

  const buckets = new Map<number, UsageBucket>();
  for (let t = bucketStart(lo); t <= hi; t += step) {
    buckets.set(t, { t, coloring: 0, story: 0, activity: 0, total: 0 });
  }

  for (const s of spends) {
    if (s.at < lo || s.at > hi) continue;
    const amt = Math.abs(s.delta);
    if (amt === 0) continue;
    const bucket = buckets.get(bucketStart(s.at));
    if (!bucket) continue;
    if (/activit/i.test(s.reason)) bucket.activity += amt;
    else if (/story/i.test(s.reason)) bucket.story += amt;
    else bucket.coloring += amt;
    bucket.total += amt;
  }

  const series = Array.from(buckets.values()).sort((a, b) => a.t - b.t);
  return {
    buckets: series,
    unit,
    fromMs: lo,
    toMs: hi,
    totalCredits: series.reduce((n, d) => n + d.total, 0),
    peakCredits: series.reduce((n, d) => Math.max(n, d.total), 0),
  };
}
