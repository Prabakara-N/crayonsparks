"use client";

import { useCallback, useEffect, useState } from "react";
import { orpc } from "@/lib/orpc/client";
import { getPlanById, type Plan } from "@/lib/billing/plans";

export interface PlanState {
  plan: Plan;
  subscriptionStatus: string | null;
  renewsAt: string | null;
  customerPortalUrl: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Loads the signed-in user's current subscription plan + state via oRPC.
 * Defaults to the Free plan until the summary resolves.
 */
export function usePlan(): PlanState {
  const [state, setState] = useState<
    Omit<PlanState, "loading" | "refresh">
  >({
    plan: getPlanById("free"),
    subscriptionStatus: null,
    renewsAt: null,
    customerPortalUrl: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await orpc.billing.summary();
      setState({
        plan: getPlanById(res.planId),
        subscriptionStatus: res.subscriptionStatus,
        renewsAt: res.subscriptionRenewsAt,
        customerPortalUrl: res.customerPortalUrl,
      });
    } catch {
      // Keep whatever we have (Free default on first load).
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, loading, refresh };
}
