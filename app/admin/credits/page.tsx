import type { Metadata } from "next";
import { CreditsMain } from "@/components/admin/credits/credits-main";

export const metadata: Metadata = { title: "Admin · Credits" };

export default function AdminCreditsPage() {
  return <CreditsMain />;
}
