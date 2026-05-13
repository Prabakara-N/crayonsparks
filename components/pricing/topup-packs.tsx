"use client";

import Link from "next/link";
import { Coins, Zap, Plus } from "lucide-react";

interface TopupPack {
  name: string;
  price: number;
  credits: number;
  icon: React.ReactNode;
  badge?: string;
  description: string;
}

const PACKS: ReadonlyArray<TopupPack> = [
  {
    name: "Top-up S",
    price: 10,
    credits: 400,
    icon: <Coins className="w-4 h-4" />,
    description: "Two extra books when you've nearly hit your monthly cap.",
  },
  {
    name: "Top-up M",
    price: 30,
    credits: 1500,
    icon: <Zap className="w-4 h-4" />,
    badge: "Best value",
    description: "Roughly 7-8 extra books. Solid for a launch sprint.",
  },
];

export function TopupPacks() {
  return (
    <div className="rounded-3xl bg-linear-to-br from-zinc-900/80 via-zinc-900/70 to-zinc-900/80 border border-white/10 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">
            Need a few more credits this month?
          </h3>
          <p className="text-neutral-400 text-sm mt-1 leading-relaxed max-w-xl">
            Top-up packs add credits on top of your subscription. They stay
            valid for 12 months and only get used after your monthly credits
            run out.
          </p>
        </div>
        <div className="text-xs text-neutral-500 inline-flex items-center gap-1.5">
          <Plus className="w-3 h-3" />
          <span>Available to Hobbyist and Pro subscribers</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {PACKS.map((pack) => (
          <div
            key={pack.name}
            className="relative rounded-2xl bg-black/40 border border-white/10 p-5 hover:border-violet-500/40 transition-colors"
          >
            {pack.badge && (
              <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                {pack.badge}
              </div>
            )}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-300 flex items-center justify-center shrink-0">
                {pack.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-base font-semibold text-white">
                    {pack.name}
                  </span>
                  <span className="text-2xl font-bold text-white tabular-nums">
                    ${pack.price}
                  </span>
                </div>
                <div className="text-sm text-violet-300 font-semibold mb-1.5">
                  +{pack.credits.toLocaleString()} credits
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {pack.description}
                </p>
                <Link
                  href="/account/billing"
                  className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-violet-300 hover:text-violet-200"
                >
                  Buy this pack →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
