"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "./auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";
import { AuthFooter } from "./auth-footer";

export function ForgotPasswordPageContent() {
  const params = useSearchParams();
  const loginHref = `/login${params.toString() ? `?${params.toString()}` : ""}`;

  return (
    <AuthShell
      heading="Forgot password?"
      subheading="Enter your email and we'll send you a link to reset it."
      footerSlot={
        <>
          <p className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Remembered it?{" "}
            <Link
              href={loginHref}
              className="font-semibold text-neutral-800 transition hover:text-neutral-900 dark:text-neutral-100 dark:hover:text-white"
            >
              Back to sign in
            </Link>
          </p>
          <AuthFooter />
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
