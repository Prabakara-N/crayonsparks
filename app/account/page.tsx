import type { Metadata } from "next";
import { DashboardMain } from "@/components/account/dashboard/dashboard-main";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function AccountDashboardPage() {
  return <DashboardMain />;
}
