import type { Metadata } from "next";
import { OverviewMain } from "@/components/admin/overview/overview-main";

export const metadata: Metadata = { title: "Admin · Overview" };

export default function AdminOverviewPage() {
  return <OverviewMain />;
}
