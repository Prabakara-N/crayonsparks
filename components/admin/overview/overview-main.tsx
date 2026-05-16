"use client";

import { useEffect, useState } from "react";
import { Users, Wand2, Coins, Activity } from "lucide-react";
import { useAdmin } from "@/lib/hooks/use-admin";
import { PageHeader } from "@/components/account/page-header";
import { ComingSoonTag } from "@/components/account/coming-soon-tag";
import { StatTile } from "./stat-tile";

export function OverviewMain() {
  const { overviewStats } = useAdmin();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    overviewStats()
      .then((stats) => setTotalUsers(stats.totalUsers))
      .catch(() => setError("Couldn't load overview stats."));
  }, [overviewStats]);

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
          value={totalUsers ?? "—"}
          hint="All signed-up users"
        />
        <StatTile
          icon={Wand2}
          label="Generations · 24h"
          value="—"
          hint="Coming soon"
        />
        <StatTile
          icon={Coins}
          label="Credits granted · 24h"
          value="—"
          hint="Coming soon"
        />
        <StatTile
          icon={Activity}
          label="Est. cost · 24h"
          value="—"
          hint="Coming soon"
        />
      </div>

      {error && (
        <p className="text-sm text-red-300 mb-4">{error}</p>
      )}

      <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Recent activity
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              Live feed of generations, purchases, and admin actions.
            </p>
          </div>
          <ComingSoonTag />
        </div>
        <p className="text-sm text-neutral-500">
          Activity stream lands once the generations + audit pipelines are
          fully wired.
        </p>
      </div>
    </div>
  );
}
