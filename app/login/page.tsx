import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInPageContent } from "@/components/auth/login/signin-page-content";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to CrayonSparks to generate and publish books.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <SignInPageContent />
    </Suspense>
  );
}
