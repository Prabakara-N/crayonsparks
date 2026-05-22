"use client";

import { Check, Loader2 } from "lucide-react";
import type { BillingCycle, Plan } from "@/lib/billing/plans";

interface PlanTierCardProps {
  plan: Plan;
  cycle: BillingCycle;
  isCurrent: boolean;
  busy: boolean;
  disabled: boolean;
  onUpgrade: (planId: "hobbyist" | "pro", cycle: BillingCycle) => void;
}

export function PlanTierCard({
  plan,
  cycle,
  isCurrent,
  busy,
  disabled,
  onUpgrade,
}: PlanTierCardProps) {
  const isFree = plan.id === "free";
  const annual = cycle === "annual" && plan.priceAnnual != null;
  const price = annual ? plan.priceAnnual! : plan.priceMonthly;
  const unit = isFree ? "" : annual ? "/ yr" : "/ mo";

  return (
    <div
      className={`relative rounded-2xl border p-5 flex flex-col ${
        plan.highlight
          ? "bg-violet-500/10 border-violet-500/40"
          : "bg-zinc-900/60 border-white/10"
      }`}
    >
      {plan.highlight && !isCurrent && (
        <span className="absolute -top-2.5 left-5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white bg-linear-to-r from-violet-500 to-cyan-400">
          Most powerful
        </span>
      )}

      <p className="font-display text-lg font-semibold text-white">
        {plan.name}
      </p>
      <p className="mt-0.5 text-xs text-neutral-400 leading-relaxed">
        {plan.tagline}
      </p>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-3xl font-bold text-white">
          ${price}
        </span>
        {unit && <span className="text-sm text-neutral-400">{unit}</span>}
      </div>
      {annual && (
        <p className="text-[11px] text-emerald-300">
          Save 20% vs monthly
        </p>
      )}

      <ul className="mt-4 space-y-1.5 grow">
        {plan.features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-xs text-neutral-300"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        {isCurrent ? (
          <div className="w-full px-3 py-2 rounded-full text-sm font-semibold text-center text-emerald-200 bg-emerald-500/10 border border-emerald-500/30">
            Your current plan
          </div>
        ) : isFree ? (
          <div className="w-full px-3 py-2 rounded-full text-sm font-medium text-center text-neutral-400 border border-white/10">
            Default tier
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              onUpgrade(plan.id as "hobbyist" | "pro", cycle)
            }
            disabled={disabled}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-white bg-linear-to-r from-violet-500 to-cyan-400 hover:opacity-95 disabled:opacity-60 transition-opacity"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? "Starting checkout…" : `Upgrade to ${plan.name}`}
          </button>
        )}
      </div>
    </div>
  );
}
