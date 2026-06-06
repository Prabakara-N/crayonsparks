"use client";

import { useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { AuthTextField } from "./auth-text-field";
import { AuthSubmitButton } from "./auth-submit-button";
import { AuthError } from "./auth-error";

export function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <MailCheck className="h-6 w-6" />
        </span>
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          If an account exists for <strong>{email.trim()}</strong>, we&apos;ve
          sent a link to reset your password. Check your inbox — and your spam
          folder just in case.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-5">
      <AuthTextField
        id="forgot-email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="hello@app.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={busy}
        required
      />
      <AuthError message={error} suggestSignUp={false} signUpHref="/signup" />
      <AuthSubmitButton busy={busy}>Send reset link</AuthSubmitButton>
    </form>
  );
}
