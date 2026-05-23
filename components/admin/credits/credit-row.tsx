"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export interface AdminCreditEntry {
  id: string;
  ownerUid: string | null;
  ownerEmail: string | null;
  delta: number;
  balanceAfter: number | null;
  reason: string;
  refKind: string;
  refId: string | null;
  createdByEmail: string | null;
  createdAt: number | null;
}

const REF_KIND_STYLES: Record<string, string> = {
  signup: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  grant: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  purchase: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  spend: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  refund: "bg-rose-500/15 text-rose-200 border-rose-500/30",
};

function formatDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CreditRowProps {
  entry: AdminCreditEntry;
}

export function CreditRow({ entry }: CreditRowProps) {
  const positive = entry.delta > 0;
  const refStyle =
    REF_KIND_STYLES[entry.refKind] ??
    "bg-neutral-500/15 text-neutral-200 border-neutral-500/30";
  return (
    <div className="rounded-xl bg-zinc-900/60 border border-white/10 px-4 py-3 flex items-center gap-3">
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          positive
            ? "bg-emerald-500/15 text-emerald-300"
            : "bg-rose-500/15 text-rose-300"
        }`}
      >
        {positive ? (
          <ArrowUpRight className="w-4 h-4" />
        ) : (
          <ArrowDownRight className="w-4 h-4" />
        )}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${refStyle}`}
          >
            {entry.refKind}
          </span>
          <span
            className={`text-sm font-semibold ${
              positive ? "text-emerald-200" : "text-rose-200"
            }`}
          >
            {positive ? "+" : ""}
            {entry.delta}
          </span>
          {entry.balanceAfter !== null && (
            <span className="text-[11px] text-neutral-500">
              → {entry.balanceAfter}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-neutral-300 truncate">
          {entry.reason || "—"}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-500">
          {entry.ownerUid ? (
            <Link
              href={`/admin/users/${entry.ownerUid}`}
              className="hover:text-amber-300 truncate max-w-[16ch]"
            >
              {entry.ownerEmail ?? entry.ownerUid.slice(0, 8)}
            </Link>
          ) : (
            <span>unknown user</span>
          )}
          <span aria-hidden>·</span>
          <span>{formatDate(entry.createdAt)}</span>
          {entry.createdByEmail && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate max-w-[20ch]">
                by {entry.createdByEmail}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
