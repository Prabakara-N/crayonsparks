/**
 * Subscription plan catalog — per PRICING_AND_BILLING_PLAN.txt section 2.
 * Pure data, client-safe. Subscription purchase + lifecycle (renewals,
 * rollover) is wired in a later slice; this catalog drives the billing UI.
 */

export type PlanId = "free" | "hobbyist" | "pro";

export type BillingCycle = "monthly" | "annual";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number | null;
  monthlyCredits: number;
  rolloverCap: number | null;
  modelAccess: "flash" | "all";
  features: string[];
  highlight?: boolean;
  variantEnvKeyMonthly?: string;
  variantEnvKeyAnnual?: string;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Make one full book to evaluate quality.",
    priceMonthly: 0,
    priceAnnual: null,
    monthlyCredits: 0,
    rolloverCap: null,
    modelAccess: "flash",
    features: [
      "50 welcome credits (one-time)",
      "Watermarked PDF export",
      "Flash models only",
      "1 book kept in your library",
      "Personal use — no commercial license",
    ],
  },
  {
    id: "hobbyist",
    name: "Hobbyist",
    tagline: "For solo KDP self-publishers shipping regularly.",
    priceMonthly: 19,
    priceAnnual: 180,
    monthlyCredits: 800,
    rolloverCap: 1500,
    modelAccess: "flash",
    variantEnvKeyMonthly: "LEMONSQUEEZY_VARIANT_HOBBYIST_MONTHLY",
    variantEnvKeyAnnual: "LEMONSQUEEZY_VARIANT_HOBBYIST_ANNUAL",
    features: [
      "800 credits / month",
      "Rolls over up to 1,500",
      "Watermark removed",
      "Commercial license for KDP",
      "All download formats (KDP + Etsy)",
      "Unlimited library retention",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For power users publishing story books at volume.",
    priceMonthly: 49,
    priceAnnual: 468,
    monthlyCredits: 3500,
    rolloverCap: 6000,
    modelAccess: "all",
    highlight: true,
    variantEnvKeyMonthly: "LEMONSQUEEZY_VARIANT_PRO_MONTHLY",
    variantEnvKeyAnnual: "LEMONSQUEEZY_VARIANT_PRO_ANNUAL",
    features: [
      "3,500 credits / month",
      "Rolls over up to 6,000",
      "Pro models unlocked (Gemini 3 Pro, GPT Image 1.5)",
      "Priority queue when capacity is tight",
      "Commercial license for KDP",
      "Everything in Hobbyist",
    ],
  },
];

export function getPlanById(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
