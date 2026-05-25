"use client";

import { useState } from "react";
import { PLANS, type BillingCycle, type PlanId } from "@/lib/billing/plans";
import { BillingToggle } from "@/components/pricing/billing-toggle";
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
        <BillingToggle value={cycle} onChange={setCycle} size="sm" />
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
