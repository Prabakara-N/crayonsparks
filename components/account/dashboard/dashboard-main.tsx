"use client";

import Link from "next/link";
import {
  Coins,
  BookOpen,
  Sparkles,
  Wand2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useUser } from "@/lib/hooks/use-user";
import { PageHeader } from "../page-header";
import { ComingSoonTag } from "../coming-soon-tag";

export function DashboardMain() {
  const { user } = useUser();
  const greeting = user?.displayName?.split(" ")[0] || "there";

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${greeting}.`}
        description="Your generation activity at a glance."
        actions={
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-linear-to-r from-violet-500 to-cyan-400 hover:opacity-95 transition-opacity"
          >
            <Wand2 className="w-4 h-4" />
            Generate
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={Coins}
          label="Credits balance"
          value="—"
          hint="Buy credits to start generating"
        />
        <StatCard
          icon={BookOpen}
          label="Books generated"
          value="0"
          hint="Across coloring + story books"
        />
        <StatCard
          icon={TrendingUp}
          label="Last 30 days"
          value="0"
          hint="Pages generated this month"
        />
      </div>

      <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Recent books
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              Your generated coloring + story books will appear here.
            </p>
          </div>
          <ComingSoonTag />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-3/4 rounded-xl bg-linear-to-br from-white/5 to-transparent border border-white/10 flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-neutral-600" />
            </div>
          ))}
        </div>
        <div className="mt-5 text-center">
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-200 hover:text-white"
          >
            Start your first book
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
          {label}
        </span>
        <Icon className="w-4 h-4 text-violet-300" />
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
    </div>
  );
}
