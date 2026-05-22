"use client";

import { useState } from "react";
import { PLANS, type BillingCycle, type PlanId } from "@/lib/billing/plans";
import { PlanTierCard } from "./plan-tier-card";

interface PlanTiersProps {
  currentPlanId: PlanId;
  busyPlanId: string | null;
  onUpgrade: (planId: "hobbyist" | "pro", cycle: BillingCycle) => void;
}

export function PlanTiers({
  currentPlanId,
  busyPlanId,
  onUpgrade,
}: PlanTiersProps) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">
            Plans
          </h2>
          <p className="text-sm text-neutral-400">
            Subscriptions include monthly credits and unlock no-watermark
            commercial exports.
          </p>
        </div>
        <div className="inline-flex p-1 rounded-full bg-zinc-900/60 border border-white/10">
          {(["monthly", "annual"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                cycle === c
                  ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {c}
              {c === "annual" && (
                <span className="ml-1 text-[10px] text-emerald-300">
                  -20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PLANS.map((plan) => (
          <PlanTierCard
            key={plan.id}
            plan={plan}
            cycle={cycle}
            isCurrent={plan.id === currentPlanId}
            busy={busyPlanId === plan.id}
            disabled={busyPlanId !== null}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>
    </div>
  );
}
