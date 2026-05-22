"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { useDialog } from "@/components/ui/confirm-dialog";
import type { IntegrationStatus } from "@/lib/hooks/use-integrations";
import type { IntegrationPlatformMeta } from "./integration-platforms";

interface IntegrationCardProps {
  meta: IntegrationPlatformMeta;
  status: IntegrationStatus | undefined;
  onDisconnect: (platform: IntegrationStatus["platform"]) => Promise<void>;
}

export function IntegrationCard({
  meta,
  status,
  onDisconnect,
}: IntegrationCardProps) {
  const dialog = useDialog();
  const [disconnecting, setDisconnecting] = useState(false);
  const connected = status?.connected ?? false;

  async function handleDisconnect() {
    const ok = await dialog.confirm({
      title: `Disconnect ${meta.name}?`,
      message:
        "CrayonSparks will no longer be able to publish to this account. You can reconnect anytime.",
      confirmText: "Disconnect",
      cancelText: "Keep connected",
      variant: "danger",
    });
    if (!ok) return;
    setDisconnecting(true);
    try {
      await onDisconnect(meta.id);
      toast.success(`${meta.name} disconnected.`);
    } catch {
      toast.error(`Couldn't disconnect ${meta.name}.`);
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <span className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
          <Store className="w-5 h-5 text-violet-200" />
        </span>
        {connected && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </span>
        )}
      </div>

      <p className="mt-3 font-display text-lg font-semibold text-white">
        {meta.name}
      </p>
      <p className="mt-1 text-xs text-neutral-400 leading-relaxed grow">
        {meta.description}
      </p>

      {connected && status?.accountHandle && (
        <p className="mt-2 text-[11px] text-neutral-500">
          Account: {status.accountHandle}
        </p>
      )}

      <div className="mt-4">
        {!meta.available ? (
          <div className="w-full px-3 py-2 rounded-full text-sm font-medium text-center text-neutral-500 border border-white/10">
            Coming soon
          </div>
        ) : connected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-red-200 bg-red-500/10 border border-red-500/30 hover:bg-red-500/15 disabled:opacity-60 transition-colors"
          >
            {disconnecting && <Loader2 className="w-4 h-4 animate-spin" />}
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        ) : (
          <a
            href={`/api/integrations/${meta.id}/authorize`}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-white bg-linear-to-r from-violet-500 to-cyan-400 hover:opacity-95 transition-opacity"
          >
            Connect {meta.name}
          </a>
        )}
      </div>
    </div>
  );
}
