"use client";

import { useEffect, useState } from "react";
import { orpc } from "@/lib/orpc/client";
import { getPlanById, type Plan } from "@/lib/billing/plans";

export interface PlanState {
  plan: Plan;
  subscriptionStatus: string | null;
  renewsAt: string | null;
  customerPortalUrl: string | null;
  loading: boolean;
}

/**
 * Loads the signed-in user's current subscription plan + state via oRPC.
 * Defaults to the Free plan until the summary resolves.
 */
export function usePlan(): PlanState {
  const [state, setState] = useState<Omit<PlanState, "loading">>({
    plan: getPlanById("free"),
    subscriptionStatus: null,
    renewsAt: null,
    customerPortalUrl: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orpc.billing
      .summary()
      .then((res) =>
        setState({
          plan: getPlanById(res.planId),
          subscriptionStatus: res.subscriptionStatus,
          renewsAt: res.subscriptionRenewsAt,
          customerPortalUrl: res.customerPortalUrl,
        }),
      )
      .catch(() => {
        // Keep the Free default.
      })
      .finally(() => setLoading(false));
  }, []);

  return { ...state, loading };
}
