import type { Metadata } from "next";
import { ReferralsMain } from "@/components/admin/referrals/referrals-main";

export const metadata: Metadata = { title: "Admin · Referrals" };

export default function AdminReferralsPage() {
  return <ReferralsMain />;
}
