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

export function CreditLedgerList({ ledger }: { ledger: LedgerEntry[] }) {
  if (ledger.length === 0) {
    return (
      <div className="text-sm text-neutral-500 text-center py-6 rounded-xl border border-dashed border-white/10">
        No credit transactions yet.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {ledger.map((entry) => {
        const positive = entry.delta > 0;
        return (
          <li
            key={entry.id}
            className="rounded-xl bg-zinc-900/60 border border-white/10 px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`font-mono text-sm font-semibold ${
                  positive ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {positive ? "+" : ""}
                {entry.delta}
              </span>
              <span className="text-xs text-neutral-400 truncate">
                {fmt(entry.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-300 leading-relaxed">
              {entry.reason}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500 font-mono">
              {entry.refKind} · by {entry.createdByEmail ?? "system"} · balance{" "}
              {entry.balanceAfter ?? "?"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
