import type { Metadata } from "next";
import { CreditsMain } from "@/components/account/credits/credits-main";

export const metadata: Metadata = {
  title: "Credits",
};

export default function AccountCreditsPage() {
  return <CreditsMain />;
}
