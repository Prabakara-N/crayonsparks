import type { Metadata } from "next";
import { Coins } from "lucide-react";
import { ComingSoonSection } from "@/components/admin/coming-soon-section";

export const metadata: Metadata = { title: "Admin · Credits" };

export default function AdminCreditsPage() {
  return (
    <ComingSoonSection
      title="Credits ledger"
      description="Global credit movement — purchases, grants, spends, refunds."
      icon={Coins}
      whenIt="Per-user ledger entries are already written on every admin grant. This global view will aggregate them once Lemon Squeezy purchases also feed the ledger (PRICING_AND_BILLING_PLAN dependency)."
    />
  );
}
