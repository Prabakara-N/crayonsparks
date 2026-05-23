"use client";

import { useEffect, useState } from "react";
import { Megaphone, Users as UsersIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmin } from "@/lib/hooks/use-admin";
import { PageHeader } from "@/components/account/page-header";
import { getReferralSourceLabel } from "@/lib/referrals/sources";

interface SummaryItem {
  source: string;
  count: number;
}

interface SummaryData {
  total: number;
  answered: number;
  unanswered: number;
  items: SummaryItem[];
  otherTexts: Array<{ uid: string; text: string }>;
}

export function ReferralsMain() {
  const { referralsSummary } = useAdmin();
  const [data, setData] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    referralsSummary()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load referrals.");
      });
    return () => {
      cancelled = true;
    };
  }, [referralsSummary]);

  const answeredPct =
    data && data.total > 0
      ? Math.round((data.answered / data.total) * 100)
      : 0;
  const peak = data?.items[0]?.count ?? 1;

  return (
    <div>
      <PageHeader
        title="Referrals"
        description="Where signed-up users said they heard about CrayonSparks."
      />

      {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

      {!data && !error ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </>
      ) : (
        data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <SummaryTile
                icon={UsersIcon}
                label="Total users"
                value={data.total.toLocaleString()}
              />
              <SummaryTile
                icon={Megaphone}
                label="Answered"
                value={`${data.answered.toLocaleString()} (${answeredPct}%)`}
              />
              <SummaryTile
                icon={Megaphone}
                label="Unanswered"
                value={data.unanswered.toLocaleString()}
                muted
              />
            </div>

            <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
              <h3 className="font-display text-base font-semibold text-white mb-4">
                By source
              </h3>
              {data.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No one has answered the survey yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.items.map((item) => {
                    const pct = (item.count / peak) * 100;
                    return (
                      <div key={item.source}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="font-medium text-white">
                            {getReferralSourceLabel(item.source)}
                          </span>
                          <span className="text-muted-foreground tabular-nums">
                            {item.count}
                            <span className="ml-1 text-neutral-500">
                              ({Math.round((item.count / data.answered) * 100)}
                              %)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-amber-400 to-orange-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {data.otherTexts.length > 0 && (
              <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5 mt-4">
                <h3 className="font-display text-base font-semibold text-white mb-3">
                  &quot;Other&quot; — free-text answers
                </h3>
                <ul className="space-y-1.5">
                  {data.otherTexts.map((entry) => (
                    <li
                      key={entry.uid}
                      className="text-sm text-neutral-300 px-3 py-2 rounded-md bg-white/5 border border-white/10"
                    >
                      {entry.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}

interface SummaryTileProps {
  icon: typeof UsersIcon;
  label: string;
  value: string;
  muted?: boolean;
}

function SummaryTile({ icon: Icon, label, value, muted }: SummaryTileProps) {
  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
      <div className="flex items-center gap-3">
        <span
          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            muted
              ? "bg-neutral-500/15 border-neutral-500/30 text-neutral-300"
              : "bg-amber-500/15 border-amber-500/30 text-amber-200"
          }`}
        >
          <Icon className="w-5 h-5" />
        </span>
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
            {label}
          </p>
          <p className="font-display text-xl font-semibold text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
