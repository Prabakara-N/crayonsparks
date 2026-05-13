"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BillingCycle } from "./billing-toggle";

export interface TierFeature {
  text: string;
  bold?: boolean;
}

export interface TierCardData {
  name: string;
  monthlyPrice: number;
  annualPrice?: number;
  icon: React.ReactNode;
  blurb: string;
  creditAllocation: string;
  features: TierFeature[];
  cta: { label: string; href: string };
  highlight?: boolean;
  badge?: string;
}

interface TierCardProps {
  tier: TierCardData;
  billing: BillingCycle;
}

export function TierCard({ tier, billing }: TierCardProps) {
  const isFree = tier.monthlyPrice === 0;
  const annualMonthly = tier.annualPrice ? tier.annualPrice / 12 : null;
  const displayPrice =
    billing === "annual" && annualMonthly !== null
      ? annualMonthly
      : tier.monthlyPrice;
  const annualTotal = tier.annualPrice;
  const monthlySavings =
    billing === "annual" && annualMonthly !== null
      ? Math.round((tier.monthlyPrice - annualMonthly) * 12)
      : 0;

  return (
    <div
      className={cn(
        "relative rounded-2xl p-6 md:p-7 flex flex-col border",
        tier.highlight
          ? "bg-linear-to-br from-violet-600 via-indigo-500 to-cyan-500 border-transparent shadow-2xl shadow-violet-500/30 text-white scale-[1.02]"
          : "bg-zinc-900/70 backdrop-blur-xl border-white/10 text-white",
      )}
    >
      {tier.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white text-violet-700 text-[11px] font-bold uppercase tracking-wider shadow-md">
          {tier.badge}
        </div>
      )}

      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center mb-3",
          tier.highlight
            ? "bg-white/20 text-white"
            : "bg-violet-500/15 text-violet-300",
        )}
      >
        {tier.icon}
      </div>

      <h3 className="text-2xl font-bold">{tier.name}</h3>
      <p
        className={cn(
          "text-sm mt-1 mb-5",
          tier.highlight ? "text-white/85" : "text-neutral-400",
        )}
      >
        {tier.blurb}
      </p>

      <div className="mb-1.5 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tracking-tight">
          ${isFree ? "0" : displayPrice.toFixed(displayPrice % 1 === 0 ? 0 : 2)}
        </span>
        {!isFree && (
          <span
            className={cn(
              "text-sm",
              tier.highlight ? "text-white/75" : "text-neutral-500",
            )}
          >
            /mo
          </span>
        )}
      </div>
      <div
        className={cn(
          "text-[11px] mb-5 h-4",
          tier.highlight ? "text-white/75" : "text-neutral-500",
        )}
      >
        {isFree
          ? "no card required"
          : billing === "annual" && annualTotal
            ? `$${annualTotal}/yr · save $${monthlySavings}`
            : "billed monthly"}
      </div>

      <div
        className={cn(
          "rounded-xl px-3 py-2.5 mb-5 text-sm font-semibold",
          tier.highlight
            ? "bg-white/15 text-white"
            : "bg-violet-500/10 text-violet-200 border border-violet-500/20",
        )}
      >
        {tier.creditAllocation}
      </div>

      <ul className="space-y-2.5 mb-6 flex-1">
        {tier.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2 text-sm">
            <Check
              className={cn(
                "w-4 h-4 mt-0.5 shrink-0",
                tier.highlight ? "text-white" : "text-emerald-400",
              )}
            />
            <span
              className={cn(
                f.bold && "font-semibold",
                tier.highlight ? "text-white/95" : "text-neutral-200",
              )}
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={tier.cta.href}
        className={cn(
          "inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-semibold transition-all",
          tier.highlight
            ? "bg-white text-violet-700 hover:bg-violet-50 shadow-md"
            : "bg-white text-zinc-900 hover:bg-neutral-100",
        )}
      >
        {tier.cta.label}
      </Link>
    </div>
  );
}
