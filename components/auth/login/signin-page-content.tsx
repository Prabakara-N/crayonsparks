"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "./auth-shell";
import { SignInForm } from "./signin-form";
import { AuthFooter } from "./auth-footer";
import { useUser } from "@/lib/hooks/use-user";

export function SignInPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading } = useUser();
  const next = params.get("next") || "/playground";

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, user, router, next]);

  return (
    <AuthShell
      heading="Sign in"
      subheading="Welcome back! Please sign in to continue."
      footerSlot={
        <>
          <p className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Don&apos;t have an account?{" "}
            <Link
              href={`/signup${params.toString() ? `?${params.toString()}` : ""}`}
              className="font-semibold text-neutral-800 transition hover:text-neutral-900 dark:text-neutral-100 dark:hover:text-white"
            >
              Sign up
            </Link>
          </p>
          <AuthFooter />
        </>
      }
    >
      <SignInForm onSuccess={() => router.replace(next)} />
    </AuthShell>
  );
}
