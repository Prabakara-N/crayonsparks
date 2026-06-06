import { Suspense } from "react";
import type { Metadata } from "next";
import { ForgotPasswordPageContent } from "@/components/auth/login/forgot-password-page-content";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your CrayonSparks account password.",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
