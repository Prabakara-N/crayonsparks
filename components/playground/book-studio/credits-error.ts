"use client";

import type { useDialog } from "@/components/ui/confirm-dialog";
import { orpc } from "@/lib/orpc/client";

type DialogApi = ReturnType<typeof useDialog>;
type Router = { push: (href: string) => void };

export function isCreditsError(message: string | null | undefined): boolean {
  if (!message) return false;
  return /not enough credits/i.test(message);
}

export async function showCreditsExhaustedDialog(
  dialog: DialogApi,
  _router: Router,
): Promise<void> {
  const ok = await dialog.confirm({
    title: "Out of credits",
    message:
      "You don't have enough credits to generate this. Buy credits or upgrade your plan to keep going.",
    confirmText: "Buy credits",
    cancelText: "Close",
  });
  if (ok && typeof window !== "undefined") {
    window.open("/pricing", "_blank", "noopener,noreferrer");
  }
}

// Client-side credit gate — read live balance and short-circuit before the API
// round-trip so the dialog appears in <100ms instead of after a long generation.
// Returns true when generation may proceed; false when it was blocked.
export async function precheckCredits(
  cost: number,
  dialog: DialogApi,
  router: Router,
): Promise<boolean> {
  if (cost <= 0) return true;
  try {
    const { balance } = await orpc.credits.balance();
    if (balance < cost) {
      await showCreditsExhaustedDialog(dialog, router);
      return false;
    }
    return true;
  } catch {
    return true;
  }
}
