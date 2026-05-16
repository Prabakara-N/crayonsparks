import type { Metadata } from "next";
import { BillingMain } from "@/components/account/billing/billing-main";

export const metadata: Metadata = {
  title: "Billing",
};

export default function AccountBillingPage() {
  return <BillingMain />;
}
