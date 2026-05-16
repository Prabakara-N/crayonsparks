"use client";

import { useState } from "react";
import { Loader2, LogOut, ShieldOff, ShieldCheck } from "lucide-react";
import { useAdmin } from "@/lib/hooks/use-admin";

interface DangerZoneCardProps {
  uid: string;
  email: string | null;
  disabled: boolean;
  onStatusChanged: (next: { disabled: boolean }) => void;
}

export function DangerZoneCard({
  uid,
  email,
  disabled,
  onStatusChanged,
}: DangerZoneCardProps) {
  const { setStatus, forceSignOut } = useAdmin();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [busy, setBusy] = useState<"status" | "signout" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const targetLabel = email || uid;
  const matchesConfirm = email
    ? confirmEmail.trim().toLowerCase() === email.toLowerCase()
    : confirmEmail.trim() === uid;

  async function toggleStatus() {
    if (!matchesConfirm) {
      setError("Type the email (or uid) exactly to confirm.");
      return;
    }
    setBusy("status");
    setError(null);
    setInfo(null);
    try {
      const nextStatus = disabled ? "active" : "disabled";
      await setStatus(uid, nextStatus);
      onStatusChanged({ disabled: !disabled });
      setInfo(
        `User ${disabled ? "re-enabled" : "disabled"}. They will be blocked from signing in.`,
      );
      setConfirmEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleForceSignOut() {
    setBusy("signout");
    setError(null);
    setInfo(null);
    try {
      await forceSignOut(uid);
      setInfo("Refresh tokens revoked. User will sign out within 1 hour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl bg-red-500/5 border border-red-500/30 p-5">
      <h3 className="text-sm font-semibold text-red-200 mb-2 flex items-center gap-2">
        <ShieldOff className="w-4 h-4" />
        Danger zone
      </h3>
      <p className="text-xs text-neutral-400 mb-4">
        Disable login or revoke active sessions. Audit-logged.
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleForceSignOut}
          disabled={busy !== null}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-200 bg-red-500/10 hover:bg-red-500/15 border border-red-500/30 disabled:opacity-60"
        >
          {busy === "signout" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          Force sign-out (revoke refresh tokens)
        </button>

        <div className="rounded-xl bg-black/40 border border-red-500/30 p-3 space-y-2">
          <p className="text-xs text-neutral-300">
            {disabled
              ? "User is currently DISABLED. Re-enabling lets them sign in again."
              : "Disabling blocks future sign-ins. Existing sessions stay until expiry."}
          </p>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 font-mono">
            Type <span className="text-amber-300">{targetLabel}</span> to confirm
          </label>
          <input
            type="text"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            disabled={busy !== null}
            className="w-full h-9 px-2 rounded-md bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500/50"
          />
          <button
            type="button"
            onClick={toggleStatus}
            disabled={busy !== null || !matchesConfirm}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-red-500/80 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === "status" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : disabled ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <ShieldOff className="w-3.5 h-3.5" />
            )}
            {disabled ? "Re-enable account" : "Disable account"}
          </button>
        </div>

        {error && <p className="text-xs text-red-300">{error}</p>}
        {info && <p className="text-xs text-emerald-300">{info}</p>}
      </div>
    </div>
  );
}
