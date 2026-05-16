"use client";

import { useEffect, useState } from "react";
import { Loader2, ScrollText } from "lucide-react";
import { useAdmin } from "@/lib/hooks/use-admin";
import { PageHeader } from "@/components/account/page-header";

interface AuditEntry {
  id: string;
  adminUid: string;
  adminEmail: string | null;
  action: string;
  targetUid: string | null;
  payload: Record<string, unknown>;
  createdAt: number | null;
}

function fmt(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString();
}

export function AuditMain() {
  const { listAudit } = useAdmin();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAudit(200)
      .then((res) => setEntries(res.items))
      .catch(() => setError("Couldn't load audit log."))
      .finally(() => setLoading(false));
  }, [listAudit]);

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Every admin action — never deletable."
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-8 text-center">
          <ScrollText className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">
            No admin actions taken yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="rounded-xl bg-zinc-900/60 border border-white/10 px-4 py-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="font-semibold text-white">{e.action}</span>
                <span className="text-xs text-neutral-400">
                  {fmt(e.createdAt)}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                by {e.adminEmail ?? e.adminUid}
                {e.targetUid && ` → target ${e.targetUid}`}
              </p>
              {Object.keys(e.payload).length > 0 && (
                <pre className="mt-2 text-[11px] text-neutral-500 font-mono bg-black/30 border border-white/5 rounded p-2 overflow-x-auto">
                  {JSON.stringify(e.payload, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
