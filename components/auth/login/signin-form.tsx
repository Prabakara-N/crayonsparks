"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithEmail } from "@/lib/auth/sign-in-helpers";
import { getFriendlyAuthError } from "@/lib/auth/friendly-errors";
import { GoogleSignInButton } from "./google-sign-in-button";
import { AuthDivider } from "./auth-divider";
import { AuthTextField } from "./auth-text-field";
import { PasswordField } from "./password-field";
import { AuthSubmitButton } from "./auth-submit-button";
import { AuthError } from "./auth-error";

interface SignInFormProps {
  onSuccess: () => void;
}

export function SignInForm({ onSuccess }: SignInFormProps) {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [suggestSignUp, setSuggestSignUp] = useState(false);
  const [busy, setBusy] = useState(false);

  const signUpHref = `/signup${params.toString() ? `?${params.toString()}` : ""}`;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuggestSignUp(false);
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setBusy(true);
    try {
      await signInWithEmail(email, password);
      onSuccess();
    } catch (err) {
      const friendly = getFriendlyAuthError(err);
      setError(friendly.message);
      setSuggestSignUp(friendly.suggestSignUp);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-5">
      <GoogleSignInButton
        onSuccess={onSuccess}
        onError={(msg) => {
          setError(msg);
          setSuggestSignUp(false);
        }}
      />
      <AuthDivider />
      <AuthTextField
        id="signin-email"
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
        id="signin-password"
        label="Password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={busy}
        required
      />
      <AuthError
        message={error}
        suggestSignUp={suggestSignUp}
        signUpHref={signUpHref}
      />
      <AuthSubmitButton busy={busy}>Sign in</AuthSubmitButton>
    </form>
  );
}
