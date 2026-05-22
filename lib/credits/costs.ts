/**
 * Credit cost model — single source of truth for what each AI operation
 * costs the user. Tunable; referenced by both the server (enforcement)
 * and the client (cost preview on Generate buttons).
 *
 * Calibration (per PRICING_AND_BILLING_PLAN.txt):
 *   - Coloring books use Flash models (~$1.20 / 24-page book API cost)
 *   - Story books use Pro models  (~$5-6 / 30-page book API cost)
 *   - Hobbyist 800 cr/mo ≈ 4 coloring books; Pro 3500 cr/mo ≈ 5 story books
 *   - Refines are deliberately cheaper than full generations.
 */

export type BookKind = "coloring" | "story";

/**
 * cover  — front cover, back cover (cover-quality model surfaces)
 * page   — one interior page, belongs-to page, or the-end page
 * refine — an edit pass on an already-generated image
 */
export type GenOp = "cover" | "page" | "refine";

/** One-time credits granted to a brand-new account (Free tier). */
export const SIGNUP_FREE_CREDITS = 50;

const COST_TABLE: Record<BookKind, Record<GenOp, number>> = {
  coloring: { cover: 4, page: 4, refine: 2 },
  story: { cover: 11, page: 11, refine: 3 },
};

export function creditCost(kind: BookKind, op: GenOp): number {
  return COST_TABLE[kind][op];
}

/**
 * Total credits to generate a full book end-to-end (front + back cover,
 * belongs-to OR the-end, and `pageCount` interior pages). Used by the
 * cost-preview UI before a bulk run.
 */
export function fullBookCost(kind: BookKind, pageCount: number): number {
  const cover = creditCost(kind, "cover");
  const page = creditCost(kind, "page");
  // front + back cover + one extra page (belongs-to / the-end) + interiors
  return cover * 2 + page * (pageCount + 1);
}
