import { Suspense } from "react";
import type { Metadata } from "next";
import { SignUpPageContent } from "@/components/auth/login/signup-page-content";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your CrayonSparks account to generate and publish books.",
};

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpPageContent />
    </Suspense>
  );
}
