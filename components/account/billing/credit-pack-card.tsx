"use client";

import { Loader2, Zap } from "lucide-react";
import type { CreditPack } from "@/lib/billing/packs";

interface CreditPackCardProps {
  pack: CreditPack;
  busy: boolean;
  disabled: boolean;
  onBuy: (packId: string) => void;
}

export function CreditPackCard({
  pack,
  busy,
  disabled,
  onBuy,
}: CreditPackCardProps) {
  return (
    <div
      className={`relative rounded-2xl border p-4 flex flex-col ${
        pack.highlight
          ? "bg-violet-500/10 border-violet-500/40"
          : "bg-zinc-900/60 border-white/10"
      }`}
    >
      {pack.highlight && (
        <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white bg-linear-to-r from-violet-500 to-cyan-400">
          Best value
        </span>
      )}
      <div className="flex items-baseline justify-between">
        <p className="font-display text-2xl font-bold text-white">
          {pack.credits}
        </p>
        <Zap className="w-4 h-4 text-violet-300" />
      </div>
      <p className="text-xs text-neutral-400">credits · {pack.name}</p>
      <p className="mt-3 font-display text-xl font-semibold text-white">
        {pack.priceLabel}
      </p>
      <p className="text-[11px] text-neutral-500">{pack.perCreditLabel}</p>
      <p className="mt-2 text-[11px] text-neutral-400 leading-relaxed grow">
        {pack.blurb}
      </p>
      <button
        type="button"
        onClick={() => onBuy(pack.id)}
        disabled={disabled}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-white bg-linear-to-r from-violet-500 to-cyan-400 hover:opacity-95 disabled:opacity-60 transition-opacity"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        {busy ? "Starting checkout…" : `Buy ${pack.priceLabel}`}
      </button>
    </div>
  );
}
