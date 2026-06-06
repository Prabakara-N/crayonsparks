import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordPageContent } from "@/components/auth/login/reset-password-page-content";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your CrayonSparks account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
