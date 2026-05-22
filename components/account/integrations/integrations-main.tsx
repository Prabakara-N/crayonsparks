"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useIntegrations } from "@/lib/hooks/use-integrations";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "../page-header";
import { INTEGRATION_PLATFORMS } from "./integration-platforms";
import { IntegrationCard } from "./integration-card";

const GUMROAD_RESULT_MESSAGES: Record<string, [string, "ok" | "err"]> = {
  connected: ["Gumroad connected — you can now publish to it.", "ok"],
  denied: ["Gumroad connection was cancelled.", "err"],
  badstate: ["Gumroad connection failed a security check. Try again.", "err"],
  notconfigured: [
    "Gumroad isn't configured yet — the API credentials are missing.",
    "err",
  ],
  error: ["Couldn't finish connecting Gumroad. Try again.", "err"],
};

export function IntegrationsMain() {
  const { items, error, refresh, disconnect } = useIntegrations();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const result = new URLSearchParams(window.location.search).get("gumroad");
    if (!result) return;
    const message = GUMROAD_RESULT_MESSAGES[result];
    if (message) {
      const [text, kind] = message;
      if (kind === "ok") toast.success(text);
      else toast.error(text);
    }
    window.history.replaceState(null, "", "/account/integrations");
    void refresh();
  }, [refresh]);

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect your marketplace accounts to publish books with one click."
      />

      {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

      {items === null && !error ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-zinc-900/60 border border-white/10 p-5 space-y-3"
            >
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-9 w-full rounded-full mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {INTEGRATION_PLATFORMS.map((meta) => (
            <IntegrationCard
              key={meta.id}
              meta={meta}
              status={items?.find((i) => i.platform === meta.id)}
              onDisconnect={disconnect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
