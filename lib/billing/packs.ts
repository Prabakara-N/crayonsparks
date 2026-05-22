/**
 * Credit top-up packs (one-time purchases) — per PRICING_AND_BILLING_PLAN.txt.
 * Pure catalog: safe to import on the client for the billing UI. The
 * Lemon Squeezy variant IDs live in env and are resolved server-side
 * (see lib/billing/lemonsqueezy.ts).
 */

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceLabel: string;
  perCreditLabel: string;
  blurb: string;
  highlight?: boolean;
  /** Env var holding this pack's Lemon Squeezy variant ID. */
  variantEnvKey: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "topup-s",
    name: "Top-up S",
    credits: 400,
    priceLabel: "$10",
    perCreditLabel: "$0.025 / credit",
    blurb: "Roughly 4 extra coloring books. Credits valid 12 months.",
    variantEnvKey: "LEMONSQUEEZY_VARIANT_TOPUP_S",
  },
  {
    id: "topup-m",
    name: "Top-up M",
    credits: 1500,
    priceLabel: "$30",
    perCreditLabel: "$0.020 / credit",
    blurb: "Best value — ~5 story books of overflow. Credits valid 12 months.",
    highlight: true,
    variantEnvKey: "LEMONSQUEEZY_VARIANT_TOPUP_M",
  },
];

export function getPackById(id: string): CreditPack | null {
  return CREDIT_PACKS.find((p) => p.id === id) ?? null;
}
