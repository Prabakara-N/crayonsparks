"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
    if (params.get("purchase") !== "success") return;
    window.history.replaceState(null, "", "/account/billing");
    const toastId = toast.loading(
      "Payment received — confirming credits with Lemon Squeezy…",
    );
    const sinceMs = Date.now() - 60_000;
    let cancelled = false;
    let elapsed = 0;
    const POLL_MS = 2000;
    const TIMEOUT_MS = 30_000;
    const tick = async () => {
      if (cancelled) return;
      await refresh();
      await refreshPlan();
      const purchaseEntry = entries.find(
        (e) =>
          e.delta > 0 &&
          e.refKind === "purchase" &&
          (e.createdAt ?? 0) >= sinceMs,
      );
      if (purchaseEntry) {
        toast.success(
          `+${purchaseEntry.delta.toLocaleString()} credits added — new balance ${(balance ?? 0).toLocaleString()}.`,
          { id: toastId, duration: 6000 },
        );
        return;
      }
      elapsed += POLL_MS;
      if (elapsed >= TIMEOUT_MS) {
        toast.success(
          "Payment received. Credits will appear here within a minute — refresh if you don't see them.",
          { id: toastId, duration: 8000 },
        );
        return;
      }
      setTimeout(tick, POLL_MS);
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [refresh, refreshPlan, entries, balance]);

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

      <Link
        href="/account/credits"
        className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5 hover:border-violet-500/40 transition-colors"
      >
        <div>
          <h2 className="font-display text-lg font-semibold text-white">
            Credit usage &amp; history
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            See where your credits go by book type, and review every
            transaction.
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-neutral-400 shrink-0" />
      </Link>
    </div>
  );
}
