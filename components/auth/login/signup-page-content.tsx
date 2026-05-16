"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "./auth-shell";
import { SignUpForm } from "./signup-form";
import { AuthFooter } from "./auth-footer";
import { useUser } from "@/lib/hooks/use-user";

export function SignUpPageContent() {
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
      heading="Create your account"
      subheading="Start generating coloring books and story books in minutes."
      footerSlot={
        <>
          <p className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Already have an account?{" "}
            <Link
              href={`/login${params.toString() ? `?${params.toString()}` : ""}`}
              className="font-semibold text-neutral-800 transition hover:text-neutral-900 dark:text-neutral-100 dark:hover:text-white"
            >
              Sign in
            </Link>
          </p>
          <AuthFooter />
        </>
      }
    >
      <SignUpForm onSuccess={() => router.replace(next)} />
    </AuthShell>
  );
}
