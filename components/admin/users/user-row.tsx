"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface AdminUserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  creditsBalance: number;
  signInProvider: string | null;
  createdAt: number | null;
  lastSignInAt: number | null;
}

function fmtDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UserRow({ user }: { user: AdminUserSummary }) {
  return (
    <Link
      href={`/admin/users/${user.uid}`}
      className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 items-center px-4 py-3 rounded-xl bg-zinc-900/60 border border-white/10 hover:border-amber-500/40 hover:bg-white/5 transition-colors"
    >
      <div className="min-w-0">
        {user.displayName && (
          <p className="text-sm font-semibold text-white truncate">
            {user.displayName}
          </p>
        )}
        <p className="text-xs text-neutral-400 truncate">
          {user.email ?? "(no email)"}
        </p>
      </div>
      <div className="hidden md:block">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono">
          Credits
        </p>
        <p className="text-sm font-semibold text-amber-200">
          {user.creditsBalance}
        </p>
      </div>
      <div className="hidden md:block">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono">
          Joined
        </p>
        <p className="text-sm text-neutral-300">{fmtDate(user.createdAt)}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-neutral-500" />
    </Link>
  );
}
