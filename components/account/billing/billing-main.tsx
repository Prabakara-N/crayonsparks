"use client";

import { Coins, Receipt, Zap } from "lucide-react";
import { PageHeader } from "../page-header";
import { ComingSoonTag } from "../coming-soon-tag";

const PACKS = [
  {
    credits: 50,
    price: "$9",
    perCredit: "$0.18 / credit",
    label: "Starter",
  },
  {
    credits: 200,
    price: "$29",
    perCredit: "$0.14 / credit",
    label: "Popular",
    highlight: true,
  },
  {
    credits: 500,
    price: "$59",
    perCredit: "$0.11 / credit",
    label: "Pro",
  },
];

export function BillingMain() {
  return (
    <div>
      <PageHeader
        title="Billing"
        description="Top up credits, see your transactions, manage your plan."
        actions={<ComingSoonTag />}
      />

      <div className="rounded-2xl bg-linear-to-br from-violet-500/20 via-indigo-500/10 to-cyan-400/10 border border-violet-500/30 p-5 md:p-6 mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-violet-200">
              Credits balance
            </p>
            <p className="mt-2 font-display text-4xl font-bold text-white">
              —
            </p>
            <p className="mt-1 text-xs text-neutral-300">
              1 credit covers 1 page generation
            </p>
          </div>
          <span className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
            <Coins className="w-6 h-6 text-white" />
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-white mb-3">
          Credit packs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PACKS.map((p) => (
            <div
              key={p.credits}
              className={`relative rounded-2xl border p-4 ${
                p.highlight
                  ? "bg-violet-500/10 border-violet-500/40"
                  : "bg-zinc-900/60 border-white/10"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white bg-linear-to-r from-violet-500 to-cyan-400">
                  {p.label}
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <p className="font-display text-2xl font-bold text-white">
                  {p.credits}
                </p>
                <Zap className="w-4 h-4 text-violet-300" />
              </div>
              <p className="text-xs text-neutral-400">credits</p>
              <p className="mt-3 font-display text-xl font-semibold text-white">
                {p.price}
              </p>
              <p className="text-[11px] text-neutral-500">{p.perCredit}</p>
              <button
                type="button"
                disabled
                className="mt-4 w-full px-3 py-2 rounded-full text-sm font-semibold text-white bg-white/10 border border-white/15 disabled:opacity-60"
              >
                Coming soon
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              Transactions
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Purchase history and credit ledger.
            </p>
          </div>
          <Receipt className="w-5 h-5 text-neutral-500" />
        </div>
        <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-neutral-500">
          No transactions yet. Once credit purchases ship, your invoices appear
          here.
        </div>
      </div>
    </div>
  );
}
