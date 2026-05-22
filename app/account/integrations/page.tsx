import type { Metadata } from "next";
import { IntegrationsMain } from "@/components/account/integrations/integrations-main";

export const metadata: Metadata = { title: "Integrations · Account" };

export default function AccountIntegrationsPage() {
  return <IntegrationsMain />;
}
