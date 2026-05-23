"use client";

import { useEffect, useState } from "react";
import { orpc } from "@/lib/orpc/client";

/**
 * Does the current user have access to Pro-tier image models
 * (Nano Banana 3 Pro / GPT Image 1.5)? Unlocks on:
 *   - Admin (always)
 *   - Paid plan (Hobbyist or Pro)
 * Free tier and signed-out users see locked pickers with an upgrade tooltip.
 */
export function useModelAccess() {
  const [hasProAccess, setHasProAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([orpc.auth.me(), orpc.billing.summary()])
      .then(([me, billing]) => {
        if (cancelled) return;
        const paid =
          billing.planId === "hobbyist" || billing.planId === "pro";
        setHasProAccess(me.isAdmin || paid);
      })
      .catch(() => {
        // Default to locked (signed-out / network failure).
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { hasProAccess, loading };
}
