"use client";

import type { useDialog } from "@/components/ui/confirm-dialog";

type DialogApi = ReturnType<typeof useDialog>;
type Router = { push: (href: string) => void };

export function isCreditsError(message: string | null | undefined): boolean {
  if (!message) return false;
  return /not enough credits/i.test(message);
}

export async function showCreditsExhaustedDialog(
  dialog: DialogApi,
  router: Router,
): Promise<void> {
  const ok = await dialog.confirm({
    title: "Out of credits",
    message:
      "You don't have enough credits to generate this. Buy credits or upgrade your plan to keep going.",
    confirmText: "Buy credits",
    cancelText: "Close",
  });
  if (ok) router.push("/pricing");
}
