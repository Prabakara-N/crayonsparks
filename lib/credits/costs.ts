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

export type BookKind = "coloring" | "story" | "activity";

/**
 * cover  — front cover, back cover (cover-quality model surfaces)
 * page   — one interior page, belongs-to page, or the-end page
 * refine — an edit pass on an already-generated image
 * single — a standalone playground freeform image (not part of a book)
 */
export type GenOp = "cover" | "page" | "refine" | "single";

/** One-time credits granted to a brand-new account (Free tier). */
export const SIGNUP_FREE_CREDITS = 50;

const COST_TABLE: Record<BookKind, Record<GenOp, number>> = {
  coloring: { cover: 12, page: 5, refine: 2, single: 2 },
  story: { cover: 12, page: 12, refine: 3, single: 2 },
  // Activity: procedural interior pages are free (the route charges nothing
  // for them); cover + illustrated pages bill at the coloring rate.
  activity: { cover: 12, page: 5, refine: 2, single: 2 },
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
