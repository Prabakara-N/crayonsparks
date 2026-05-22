"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Coins } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useAdmin } from "@/lib/hooks/use-admin";
import { PageHeader } from "@/components/account/page-header";
import { CreditGrantForm } from "./credit-grant-form";
import { DangerZoneCard } from "./danger-zone-card";
import { CreditLedgerList } from "./credit-ledger-list";

interface Profile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  creditsBalance: number;
  signInProvider: string | null;
  disabled: boolean;
  createdAt: number | null;
  updatedAt: number | null;
  lastSignInAt: number | null;
}

interface LedgerEntry {
  id: string;
  delta: number;
  balanceAfter: number | null;
  reason: string;
  refKind: string;
  createdByEmail: string | null;
  createdAt: number | null;
}

function fmt(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString();
}

export function UserDetailMain({ uid }: { uid: string }) {
  const { getUser } = useAdmin();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUser(uid);
      setProfile(result.profile);
      setLedger(result.ledger);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user.");
    } finally {
      setLoading(false);
    }
  }, [getUser, uid]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading && !profile) {
    return <LoadingState label="Loading user…" />;
  }
  if (error) {
    return <p className="text-sm text-red-300">{error}</p>;
  }
  if (!profile) return null;

  return (
    <div>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> Back to users
      </Link>

      <PageHeader
        title={profile.displayName || profile.email || profile.uid}
        description={profile.email ?? "(no email)"}
        actions={
          profile.disabled ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-red-200 bg-red-500/15 border border-red-500/30">
              Disabled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-emerald-200 bg-emerald-500/15 border border-emerald-500/30">
              Active
            </span>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
              Credits balance
            </span>
            <Coins className="w-4 h-4 text-amber-300" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-amber-200">
            {profile.creditsBalance}
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-4">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
            Joined
          </p>
          <p className="mt-2 text-sm text-white">{fmt(profile.createdAt)}</p>
          <p className="text-[11px] text-neutral-500 mt-1">
            via {profile.signInProvider ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-4">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
            Last sign-in
          </p>
          <p className="mt-2 text-sm text-white">
            {fmt(profile.lastSignInAt)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1 font-mono truncate">
            uid {profile.uid}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <CreditGrantForm
          uid={profile.uid}
          currentBalance={profile.creditsBalance}
          onGranted={() => void reload()}
        />
        <DangerZoneCard
          uid={profile.uid}
          email={profile.email}
          disabled={profile.disabled}
          onStatusChanged={() => void reload()}
        />
      </div>

      <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-5">
        <h3 className="font-display text-lg font-semibold text-white mb-3">
          Credit ledger
        </h3>
        <CreditLedgerList ledger={ledger} />
      </div>
    </div>
  );
}
