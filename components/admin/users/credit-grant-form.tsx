"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Coins } from "lucide-react";
import { useAdmin } from "@/lib/hooks/use-admin";

interface CreditGrantFormProps {
  uid: string;
  currentBalance: number;
  onGranted: (newBalance: number) => void;
}

export function CreditGrantForm({
  uid,
  currentBalance,
  onGranted,
}: CreditGrantFormProps) {
  const { grantCredits } = useAdmin();
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const parsedDelta = Number(delta);
  const validDelta =
    Number.isInteger(parsedDelta) &&
    parsedDelta !== 0 &&
    parsedDelta >= -10_000 &&
    parsedDelta <= 10_000;
  const validReason = reason.trim().length >= 8;
  const newBalance = currentBalance + (validDelta ? parsedDelta : 0);
  const canSubmit = validDelta && validReason && !busy && newBalance >= 0;

  function handlePreview(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validDelta) {
      setError("Delta must be a non-zero integer between -10,000 and 10,000.");
      return;
    }
    if (!validReason) {
      setError("Reason must be at least 8 characters.");
      return;
    }
    if (newBalance < 0) {
      setError("Cannot bring balance below 0.");
      return;
    }
    setConfirming(true);
  }

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      const result = await grantCredits(uid, parsedDelta, reason.trim());
      onGranted(result.newBalance);
      setDelta("");
      setReason("");
      setConfirming(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to grant credits.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-amber-500/30 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Coins className="w-4 h-4 text-amber-300" />
        <h3 className="text-sm font-semibold text-white">Grant or revoke credits</h3>
      </div>
      <p className="text-xs text-neutral-400 mb-4">
        Positive delta grants, negative delta revokes. Capped to ±10,000 per
        action. Audit-logged.
      </p>

      <form onSubmit={handlePreview} className="space-y-3">
        <div>
          <label
            htmlFor="grant-delta"
            className="block text-xs font-semibold text-neutral-300 mb-1"
          >
            Delta (credits)
          </label>
          <input
            id="grant-delta"
            type="number"
            inputMode="numeric"
            step="1"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            disabled={busy}
            placeholder="e.g. 50 or -10"
            className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label
            htmlFor="grant-reason"
            className="block text-xs font-semibold text-neutral-300 mb-1"
          >
            Reason (min 8 chars)
          </label>
          <textarea
            id="grant-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={busy}
            rows={2}
            placeholder="e.g. Refund for failed generation on 2026-05-15"
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 resize-y"
          />
        </div>

        {error && <p className="text-xs text-red-300">{error}</p>}

        {!confirming && (
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-amber-500/80 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Preview grant
          </button>
        )}

        {confirming && (
          <div className="space-y-3 rounded-xl bg-black/40 border border-amber-500/40 p-3">
            <p className="text-xs text-amber-200">Confirm grant:</p>
            <dl className="text-xs space-y-1">
              <div className="flex justify-between">
                <dt className="text-neutral-400">Current balance</dt>
                <dd className="text-white font-mono">{currentBalance}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-400">Delta</dt>
                <dd
                  className={`font-mono font-semibold ${
                    parsedDelta > 0 ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {parsedDelta > 0 ? "+" : ""}
                  {parsedDelta}
                </dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                <dt className="text-neutral-300 font-semibold">New balance</dt>
                <dd className="text-amber-200 font-mono font-bold">
                  {newBalance}
                </dd>
              </div>
            </dl>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={busy}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-amber-500 hover:bg-amber-400 disabled:opacity-60"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
