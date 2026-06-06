"use client";

import { useEffect, useState } from "react";
import { Users, Wand2, Coins, Activity } from "lucide-react";
import { useAdmin } from "@/lib/hooks/use-admin";
import { PageHeader } from "@/components/account/page-header";
import { StatTile } from "./stat-tile";
import { type AdminGeneration } from "@/components/admin/generations/generation-row";
import { GenerationCard } from "@/components/admin/generations/generation-card";

interface OverviewStats {
  totalUsers: number;
  generations24h: number;
  creditsGranted24h: number;
  creditsSpent24h: number;
  creditUsdRate: number;
}

export function OverviewMain() {
  const { overviewStats, listGenerations } = useAdmin();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recent, setRecent] = useState<AdminGeneration[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    overviewStats()
      .then(setStats)
      .catch(() => setError("Couldn't load overview stats."));
    listGenerations({ limit: 6 })
      .then((r) => setRecent(r.items))
      .catch(() => setRecent([]));
  }, [overviewStats, listGenerations]);

  const estCost = stats
    ? `$${(stats.creditsSpent24h * stats.creditUsdRate).toFixed(2)}`
    : "—";

  return (
    <div>
      <PageHeader
        title="Overview"
        description="At-a-glance health of the platform."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatTile
          icon={Users}
          label="Total users"
          value={stats?.totalUsers ?? "—"}
          hint="All signed-up users"
        />
        <StatTile
          icon={Wand2}
          label="Generations · 24h"
          value={stats?.generations24h ?? "—"}
          hint="Books created in last 24h"
        />
        <StatTile
          icon={Coins}
          label="Credits granted · 24h"
          value={stats?.creditsGranted24h ?? "—"}
          hint="Signups + grants + purchases"
        />
        <StatTile
          icon={Activity}
          label="Est. cost · 24h"
          value={estCost}
          hint={`${stats?.creditsSpent24h ?? 0} credits spent`}
        />
      </div>

      {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

      <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
        <div className="mb-3">
          <h3 className="font-display text-lg font-semibold text-white">
            Recent activity
          </h3>
          <p className="text-sm text-neutral-400 mt-1">
            Latest books generated across the platform.
          </p>
        </div>
        {recent === null ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-neutral-500">No activity yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {recent.map((g) => (
              <GenerationCard key={g.bookId} item={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
