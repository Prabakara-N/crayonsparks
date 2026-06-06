"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "./auth-shell";
import { ResetPasswordForm } from "./reset-password-form";
import { AuthFooter } from "./auth-footer";

export function ResetPasswordPageContent() {
  const params = useSearchParams();
  const oobCode = params.get("oobCode");
  const [done, setDone] = useState(false);

  return (
    <AuthShell
      heading={done ? "Password updated" : "Choose a new password"}
      subheading={
        done
          ? "You can now sign in with your new password."
          : "Pick a strong password you don't use anywhere else."
      }
      footerSlot={
        <>
          {!done && (
            <p className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              <Link
                href="/login"
                className="font-semibold text-neutral-800 transition hover:text-neutral-900 dark:text-neutral-100 dark:hover:text-white"
              >
                Back to sign in
              </Link>
            </p>
          )}
          <AuthFooter />
        </>
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-linear-to-b from-blue-500 to-blue-600 text-sm font-medium text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] transition hover:brightness-105"
          >
            Continue to sign in
          </Link>
        </div>
      ) : (
        <ResetPasswordForm oobCode={oobCode} onSuccess={() => setDone(true)} />
      )}
    </AuthShell>
  );
}
