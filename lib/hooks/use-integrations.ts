"use client";

import { useCallback, useEffect, useState } from "react";
import { orpc } from "@/lib/orpc/client";

export type IntegrationPlatform = "gumroad" | "pinterest" | "etsy";

export interface IntegrationStatus {
  platform: IntegrationPlatform;
  connected: boolean;
  accountHandle: string | null;
  connectedAt: number | null;
}

export function useIntegrations() {
  const [items, setItems] = useState<IntegrationStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await orpc.integrations.status();
      setItems(res.items as IntegrationStatus[]);
    } catch {
      setError("Couldn't load your connected accounts.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const disconnect = useCallback(
    async (platform: IntegrationPlatform) => {
      await orpc.integrations.disconnect({ platform });
      await refresh();
    },
    [refresh],
  );

  return { items, error, refresh, disconnect };
}
