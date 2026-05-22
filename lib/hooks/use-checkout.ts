"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthContext } from "@/components/auth/auth-provider";
import { orpc } from "@/lib/orpc/client";
import type { BillingCycle } from "@/lib/billing/plans";

/**
 * One-click checkout from anywhere (pricing page, billing page).
 * Signed-in users go straight to the Lemon Squeezy hosted checkout;
 * signed-out users are sent to /login and returned afterwards.
 */
export function useCheckout(returnTo = "/pricing") {
  const { user } = useAuthContext();
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Clear the busy lock when the page is restored from the back/forward
  // cache (user clicked Buy → Lemon Squeezy → browser Back).
  useEffect(() => {
    const clear = () => setBusyKey(null);
    window.addEventListener("pageshow", clear);
    return () => window.removeEventListener("pageshow", clear);
  }, []);

  const go = useCallback(
    async (key: string, create: () => Promise<{ url: string }>) => {
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(returnTo)}`);
        return;
      }
      setBusyKey(key);
      try {
        const { url } = await create();
        window.location.href = url;
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Could not start checkout.",
        );
        setBusyKey(null);
      }
    },
    [user, router, returnTo],
  );

  const startSubscription = useCallback(
    (planId: "hobbyist" | "pro", cycle: BillingCycle) =>
      go(planId, () =>
        orpc.billing.createSubscriptionCheckout({ planId, cycle }),
      ),
    [go],
  );

  const startPack = useCallback(
    (packId: string) =>
      go(packId, () => orpc.billing.createCheckout({ packId })),
    [go],
  );

  return { busyKey, startSubscription, startPack };
}
