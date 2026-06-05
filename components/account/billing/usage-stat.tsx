"use client";

type UsageStatTone = "white" | "cyan" | "violet" | "amber";

interface UsageStatProps {
  label: string;
  value: number;
  tone: UsageStatTone;
}

const TONE: Record<UsageStatTone, string> = {
  white: "text-white",
  cyan: "text-cyan-300",
  violet: "text-violet-300",
  amber: "text-amber-300",
};

export function UsageStat({ label, value, tone }: UsageStatProps) {
  return (
    <div className="rounded-xl bg-black/30 border border-white/5 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p className={`mt-0.5 font-mono text-lg font-semibold ${TONE[tone]}`}>
        {value.toLocaleString()}
        <span className="text-xs text-neutral-500 font-sans ml-1">cr</span>
      </p>
    </div>
  );
}
