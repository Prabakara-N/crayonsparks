import { hashSeed, makeRng } from "./rng";
import {
  PLANNABLE_TYPES,
  type ActivityAgeBand,
  type ActivityCounts,
  type ActivityType,
} from "./types";

// Reading/spelling puzzles a pre-reader (ages 3-5) cannot do — hard-excluded
// for the toddler band per KDP/Etsy kids-activity norms.
export const READING_TYPES: ActivityType[] = ["crossword", "word-search"];

// Activity types that produce a solvable answer key (a solution page).
// Tracing and color-by-number have no "answer".
export const SOLVABLE_TYPES: ActivityType[] = [
  "maze",
  "word-search",
  "crossword",
  "dot-to-dot",
  "matching",
  "counting",
  "spot-difference",
  "seek-and-find",
];

export interface ActivitySequenceInput {
  pageCount: number;
  age?: ActivityAgeBand;
  counts?: ActivityCounts;
  weights?: Partial<Record<ActivityType, number>>;
  mix?: ActivityType[];
}

// Forces the quota map to sum to exactly pageCount — trims the largest buckets when over, hands leftover pages round-robin when under.
function reconcileToPageCount(
  quotas: { t: ActivityType; q: number }[],
  pageCount: number,
): void {
  let total = quotas.reduce((s, x) => s + x.q, 0);
  while (total > pageCount) {
    const largest = quotas.reduce((a, b) => (b.q > a.q ? b : a));
    if (largest.q <= 0) break;
    largest.q -= 1;
    total -= 1;
  }
  let k = 0;
  while (total < pageCount && quotas.length) {
    quotas[k % quotas.length].q += 1;
    total += 1;
    k += 1;
  }
}

// Builds an interleaved page sequence honoring per-type weights (or an equal
// mix / all types), age-gating reading puzzles for toddlers. Pure + client-safe
// so the studio form can preview the exact split the planner will produce.
export function buildActivitySequence(input: ActivitySequenceInput): ActivityType[] {
  const pageCount = Math.max(1, Math.floor(input.pageCount));
  // Age-gate (no reading puzzles for toddlers) applies ONLY to the default
  // all-types mix. If the user EXPLICITLY selects types (weights or mix), we
  // honor every one of them — never silently drop a selected type.
  const defaultAllowed = (t: ActivityType): boolean =>
    PLANNABLE_TYPES.includes(t) && !(input.age === "toddlers" && READING_TYPES.includes(t));

  // Exact per-type page counts take priority — honored verbatim, then reconciled to pageCount (trim overflow / auto-fill shortfall).
  const counts = input.counts;
  if (counts && Object.values(counts).some((c) => (c ?? 0) > 0)) {
    const quotas = (Object.entries(counts) as [ActivityType, number][])
      .filter(([t, c]) => PLANNABLE_TYPES.includes(t) && (c ?? 0) > 0)
      .map(([t, c]) => ({ t, q: Math.max(0, Math.round(c)) }));
    reconcileToPageCount(quotas, pageCount);
    return interleaveQuotas(quotas, pageCount);
  }

  let entries: [ActivityType, number][];
  const weights = input.weights;
  if (weights && Object.values(weights).some((w) => (w ?? 0) > 0)) {
    entries = (Object.entries(weights) as [ActivityType, number][]).filter(
      ([t, w]) => PLANNABLE_TYPES.includes(t) && (w ?? 0) > 0,
    );
  } else if (input.mix?.length) {
    entries = input.mix.filter((t) => PLANNABLE_TYPES.includes(t)).map((t) => [t, 1]);
  } else {
    entries = PLANNABLE_TYPES.filter(defaultAllowed).map((t) => [t, 1]);
  }
  if (!entries.length) entries = PLANNABLE_TYPES.filter(defaultAllowed).map((t) => [t, 1]);

  // Give each type its proportional FLOOR share first (equal base when all
  // weights are equal), then hand out the leftover pages across a
  // deterministic pseudo-random order — so the balance isn't always dumped on
  // the first type. Deterministic (seeded by the inputs) so the studio preview
  // matches the plan the planner actually builds.
  const totalW = entries.reduce((s, [, w]) => s + w, 0);
  const quotas = entries.map(([t, w]) => ({ t, q: Math.floor((w / totalW) * pageCount) }));
  let remainder = pageCount - quotas.reduce((s, x) => s + x.q, 0);
  const seed =
    hashSeed(entries.map(([t]) => t).join("|")) + pageCount * 1000003 + entries.length * 131;
  const order = makeRng(seed).shuffle(quotas.map((_, i) => i));
  let k = 0;
  while (remainder > 0) {
    quotas[order[k % order.length]].q += 1;
    remainder -= 1;
    k += 1;
  }

  return interleaveQuotas(quotas, pageCount);
}

// Round-robins through the per-type quotas so activities interleave rather than clustering (all mazes, then all tracing). Mutates the quotas.
function interleaveQuotas(
  quotas: { t: ActivityType; q: number }[],
  pageCount: number,
): ActivityType[] {
  const seq: ActivityType[] = [];
  while (seq.length < pageCount) {
    let placed = false;
    for (const r of quotas) {
      if (r.q > 0 && seq.length < pageCount) {
        seq.push(r.t);
        r.q -= 1;
        placed = true;
      }
    }
    if (!placed) break;
  }
  return seq;
}

export interface SequenceSummaryEntry {
  type: ActivityType;
  count: number;
}

// Counts per type, sorted most-frequent first.
export function summarizeSequence(seq: ActivityType[]): SequenceSummaryEntry[] {
  const counts = new Map<ActivityType, number>();
  for (const t of seq) counts.set(t, (counts.get(t) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

// How many answer-key pages the sequence will add (solvable puzzles only).
export function countAnswerKeyPages(seq: ActivityType[]): number {
  return seq.filter((t) => SOLVABLE_TYPES.includes(t)).length;
}
