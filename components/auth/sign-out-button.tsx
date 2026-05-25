"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/sign-in-helpers";
import { useDialog } from "@/components/ui/confirm-dialog";

interface SignOutButtonProps {
  onAfter?: () => void;
  onBeforeConfirm?: () => void;
  className?: string;
}

export function SignOutButton({
  onAfter,
  onBeforeConfirm,
  className = "",
}: SignOutButtonProps) {
  const router = useRouter();
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    onBeforeConfirm?.();
    const ok = await dialog.confirm({
      title: "Sign out?",
      message:
        "You'll need to sign in again to get back into your account.",
      confirmText: "Sign out",
      cancelText: "Stay signed in",
      variant: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await signOut();
      onAfter?.();
      router.refresh();
      router.push("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`inline-flex items-center gap-2 text-sm text-left text-red-300 hover:text-red-200 disabled:opacity-60 ${className}`}
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      Sign out
    </button>
  );
}
