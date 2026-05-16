"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signInWithGoogle } from "@/lib/auth/sign-in-helpers";
import { friendlyAuthError } from "@/lib/auth/friendly-errors";
import { GoogleIcon } from "./google-icon";

interface GoogleSignInButtonProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    onError("");
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (e) {
      onError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-transparent bg-white text-sm font-medium text-neutral-700 shadow-sm ring-1 shadow-black/10 ring-black/10 transition duration-150 hover:bg-neutral-50 active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-100 dark:shadow-none dark:ring-white/10 dark:hover:bg-neutral-700"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon className="h-4 w-4" />
      )}
      Continue with Google
    </button>
  );
}
