"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { confirmReset, verifyResetCode } from "@/lib/auth/sign-in-helpers";
import { getFriendlyAuthError } from "@/lib/auth/friendly-errors";
import { PasswordField } from "./password-field";
import { AuthSubmitButton } from "./auth-submit-button";
import { AuthError } from "./auth-error";

interface ResetPasswordFormProps {
  oobCode: string | null;
  onSuccess: () => void;
}

type CodeState =
  | { status: "verifying" }
  | { status: "valid"; email: string }
  | { status: "invalid"; message: string };

export function ResetPasswordForm({ oobCode, onSuccess }: ResetPasswordFormProps) {
  const [code, setCode] = useState<CodeState>(() =>
    oobCode
      ? { status: "verifying" }
      : {
          status: "invalid",
          message: "This reset link is missing or malformed. Request a new one.",
        },
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!oobCode) return;
    let active = true;
    verifyResetCode(oobCode)
      .then((email) => {
        if (active) setCode({ status: "valid", email });
      })
      .catch((err) => {
        if (!active) return;
        setCode({
          status: "invalid",
          message: getFriendlyAuthError(
            err,
            "This reset link is invalid or has expired. Request a new one.",
          ).message,
        });
      });
    return () => {
      active = false;
    };
  }, [oobCode]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!oobCode) return;
    setBusy(true);
    try {
      await confirmReset(oobCode, password);
      onSuccess();
    } catch (err) {
      setError(getFriendlyAuthError(err).message);
    } finally {
      setBusy(false);
    }
  }

  if (code.status === "verifying") {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-neutral-500 dark:text-neutral-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Verifying your reset link…
      </div>
    );
  }

  if (code.status === "invalid") {
    return <AuthError message={code.message} />;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-5">
      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        Setting a new password for{" "}
        <strong className="text-neutral-700 dark:text-neutral-200">
          {code.email}
        </strong>
      </p>
      <PasswordField
        id="reset-password"
        label="New password"
        autoComplete="new-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={busy}
        required
      />
      <PasswordField
        id="reset-password-confirm"
        label="Confirm new password"
        autoComplete="new-password"
        placeholder="••••••••"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        disabled={busy}
        required
      />
      <AuthError message={error} />
      <AuthSubmitButton busy={busy}>Reset password</AuthSubmitButton>
    </form>
  );
}
