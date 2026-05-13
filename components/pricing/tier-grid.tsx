"use client";

import { useState } from "react";
import { BillingToggle, type BillingCycle } from "./billing-toggle";
import { TierCard, type TierCardData } from "./tier-card";

interface TierGridProps {
  tiers: ReadonlyArray<TierCardData>;
}

export function TierGrid({ tiers }: TierGridProps) {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  return (
    <>
      <div className="flex justify-center mb-10">
        <BillingToggle value={billing} onChange={setBilling} />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <TierCard key={t.name} tier={t} billing={billing} />
        ))}
      </div>
    </>
  );
}
