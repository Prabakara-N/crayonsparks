"use client";

import { PageHeader } from "../page-header";
import { CreditUsagePanel } from "./credit-usage-panel";
import { CreditLedger } from "./credit-ledger";

export function CreditsMain() {
  return (
    <div>
      <PageHeader
        title="Credits"
        description="Track how your credits are spent and review every transaction."
      />
      <CreditUsagePanel />
      <CreditLedger />
    </div>
  );
}
