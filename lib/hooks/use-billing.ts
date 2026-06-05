"use client";

import { useCallback } from "react";
import { orpc } from "@/lib/orpc/client";

type BillingCycle = "monthly" | "annual";
type SubscriptionPlanId = "hobbyist" | "pro";

export function useBilling() {
  return {
    createCheckout: useCallback(
      (packId: string) => orpc.billing.createCheckout({ packId }),
      [],
    ),
    createSubscriptionCheckout: useCallback(
      (planId: SubscriptionPlanId, cycle: BillingCycle) =>
        orpc.billing.createSubscriptionCheckout({ planId, cycle }),
      [],
    ),
    cancelSubscription: useCallback(
      () => orpc.billing.cancelSubscription(),
      [],
    ),
  };
}
