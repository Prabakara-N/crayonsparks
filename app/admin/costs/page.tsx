import type { Metadata } from "next";
import { CostsMain } from "@/components/admin/costs/costs-main";

export const metadata: Metadata = { title: "Admin · Costs" };

export default function AdminCostsPage() {
  return <CostsMain />;
}
