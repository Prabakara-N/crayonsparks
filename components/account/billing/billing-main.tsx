"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import { useCredits } from "@/lib/hooks/use-credits";
import { useBilling } from "@/lib/hooks/use-billing";
import { usePlan } from "@/lib/hooks/use-plan";
import { useDialog } from "@/components/ui/confirm-dialog";
import { CREDIT_PACKS } from "@/lib/billing/packs";
import type { BillingCycle, PlanId } from "@/lib/billing/plans";
import { PageHeader } from "../page-header";
import { CreditPackCard } from "./credit-pack-card";
import { CurrentPlanCard } from "./current-plan-card";
import { PlanTiers } from "./plan-tiers";

export function BillingMain() {
  const { balance, entries, loading, refresh } = useCredits({
    withLedger: true,
  });
  const {
    plan,
    renewsAt,
    customerPortalUrl,
    subscriptionStatus,
    loading: planLoading,
    refresh: refreshPlan,
  } = usePlan();
  const { createCheckout, createSubscriptionCheckout, cancelSubscription } =
    useBilling();
  const dialog = useDialog();
  // One shared key — any in-flight checkout disables every other button.
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const clear = () => setBusyKey(null);
    window.addEventListener("pageshow", clear);
    return () => window.removeEventListener("pageshow", clear);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchase") === "success") {
      toast.success(
        "Payment received — your credits will appear here shortly.",
      );
      window.history.replaceState(null, "", "/account/billing");
      void refresh();
      const t = setTimeout(() => void refresh(), 4000);
      return () => clearTimeout(t);
    }
  }, [refresh]);

  async function handleBuy(packId: string) {
    if (busyKey) return;
    setBusyKey(packId);
    try {
      const { url } = await createCheckout(packId);
      window.location.href = url;
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not start checkout.",
      );
      setBusyKey(null);
    }
  }

  async function handleUpgrade(
    planId: "hobbyist" | "pro",
    cycle: BillingCycle,
  ) {
    if (busyKey) return;
    setBusyKey(planId);
    try {
      const { url } = await createSubscriptionCheckout(planId, cycle);
      window.location.href = url;
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not start checkout.",
      );
      setBusyKey(null);
    }
  }

  async function handleCancelSubscription() {
    const ok = await dialog.confirm({
      title: `Cancel your ${plan.name} subscription?`,
      message:
        "You keep full access and your credits until the end of the current paid period. After that the account reverts to the Free plan. You can resubscribe anytime.",
      confirmText: "Cancel subscription",
      cancelText: "Keep subscription",
      variant: "danger",
    });
    if (!ok) return;
    setCancelling(true);
    try {
      await cancelSubscription();
      toast.success("Subscription cancelled — active until the period ends.");
      await refreshPlan();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not cancel the subscription.",
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Top up credits, see your transactions, manage your plan."
      />

      <CurrentPlanCard
        plan={plan}
        planLoading={planLoading}
        balance={balance}
        balanceLoading={loading}
        renewsAt={renewsAt}
        customerPortalUrl={customerPortalUrl}
        subscriptionStatus={subscriptionStatus}
        cancelling={cancelling}
        onCancel={handleCancelSubscription}
      />

      <PlanTiers
        currentPlanId={plan.id as PlanId}
        busyPlanId={busyKey}
        onUpgrade={handleUpgrade}
      />

      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-white mb-3">
          Top up credits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CREDIT_PACKS.map((pack) => (
            <CreditPackCard
              key={pack.id}
              pack={pack}
              busy={busyKey === pack.id}
              disabled={busyKey !== null}
              onBuy={handleBuy}
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">
          Secure checkout by Lemon Squeezy. Credits land in your account the
          moment payment clears.
        </p>
      </div>

      <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              Credit ledger
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Every grant, purchase, and spend on your account.
            </p>
          </div>
          <Receipt className="w-5 h-5 text-neutral-500" />
        </div>
        {loading ? (
          <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-neutral-500">
            Loading ledger…
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-neutral-500">
            No transactions yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => {
              const positive = e.delta > 0;
              return (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-black/30 border border-white/5 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-neutral-200 truncate">
                      {e.reason}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono mt-0.5">
                      {e.refKind}
                      {e.createdAt
                        ? ` · ${new Date(e.createdAt).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-sm font-semibold shrink-0 ${
                      positive ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {e.delta}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
