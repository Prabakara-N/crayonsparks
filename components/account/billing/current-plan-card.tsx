"use client";

import { Coins, BadgeCheck, ExternalLink, Loader2 } from "lucide-react";
import type { Plan } from "@/lib/billing/plans";

interface CurrentPlanCardProps {
  plan: Plan;
  planLoading: boolean;
  balance: number | null;
  balanceLoading: boolean;
  renewsAt: string | null;
  customerPortalUrl: string | null;
  subscriptionStatus: string | null;
  cancelling: boolean;
  onCancel: () => void;
}

function formatRenewal(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CurrentPlanCard({
  plan,
  planLoading,
  balance,
  balanceLoading,
  renewsAt,
  customerPortalUrl,
  subscriptionStatus,
  cancelling,
  onCancel,
}: CurrentPlanCardProps) {
  const renewal = formatRenewal(renewsAt);
  const isPaid = plan.id !== "free";
  const isCancelled = subscriptionStatus === "cancelled";
  return (
    <div className="rounded-2xl bg-linear-to-br from-violet-500/20 via-indigo-500/10 to-cyan-400/10 border border-violet-500/30 p-5 md:p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-violet-200">
            <BadgeCheck className="w-3.5 h-3.5" />
            Current plan
          </p>
          <p className="mt-1.5 font-display text-3xl font-bold text-white">
            {planLoading ? "…" : plan.name}
          </p>
          <p className="mt-1 text-xs text-neutral-300">{plan.tagline}</p>
          {plan.id === "free" ? (
            <p className="mt-2 text-xs text-violet-200">
              Upgrade below for monthly credits, no watermark, and a
              commercial license.
            </p>
          ) : (
            <p className="mt-2 text-xs text-neutral-300">
              {plan.monthlyCredits.toLocaleString()} credits refresh each
              month
              {plan.rolloverCap
                ? ` · rolls over up to ${plan.rolloverCap.toLocaleString()}`
                : ""}
              {renewal ? ` · renews ${renewal}` : ""}.
            </p>
          )}
          {isPaid && isCancelled && (
            <p className="mt-2 text-xs text-amber-300">
              Subscription cancelled — access continues
              {renewal ? ` until ${renewal}` : " until the period ends"}, then
              the account reverts to Free.
            </p>
          )}

          {isPaid && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {customerPortalUrl && (
                <a
                  href={customerPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-white/10 border border-white/15 hover:bg-white/15 transition-colors"
                >
                  Manage subscription
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {!isCancelled && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={cancelling}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-red-200 bg-red-500/10 border border-red-500/30 hover:bg-red-500/15 disabled:opacity-60 transition-colors"
                >
                  {cancelling && <Loader2 className="w-3 h-3 animate-spin" />}
                  {cancelling ? "Cancelling…" : "Cancel subscription"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-violet-200">
            Credits balance
          </p>
          <p className="mt-1 font-display text-4xl font-bold text-white tabular-nums">
            {balanceLoading ? "…" : (balance ?? 0).toLocaleString()}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-neutral-300">
            <Coins className="w-3 h-3" />
            spent per page generated
          </span>
        </div>
      </div>
    </div>
  );
}
