"use client";

import { useState, type FormEvent } from "react";
import { signUpWithEmail } from "@/lib/auth/sign-in-helpers";
import { friendlyAuthError } from "@/lib/auth/friendly-errors";
import { GoogleSignInButton } from "./google-sign-in-button";
import { AuthDivider } from "./auth-divider";
import { AuthTextField } from "./auth-text-field";
import { PasswordField } from "./password-field";
import { AuthSubmitButton } from "./auth-submit-button";
import { AuthError } from "./auth-error";

interface SignUpFormProps {
  onSuccess: () => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match. Please re-enter the confirmation.");
      return;
    }
    setBusy(true);
    try {
      await signUpWithEmail(email, password);
      onSuccess();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-5">
      <GoogleSignInButton onSuccess={onSuccess} onError={setError} />
      <AuthDivider />
      <AuthTextField
        id="signup-email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="hello@app.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={busy}
        required
      />
      <PasswordField
        id="signup-password"
        label="Password"
        autoComplete="new-password"
        placeholder="At least 6 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={busy}
        required
      />
      <PasswordField
        id="signup-confirm-password"
        label="Confirm password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={busy}
        required
      />
      <AuthError message={error} />
      <AuthSubmitButton busy={busy}>Create account</AuthSubmitButton>
    </form>
  );
}
