import type { ActivityType } from "./types";

// How each activity reads as a cover illustration, so the front cover depicts
// the book's ACTUAL dominant activities instead of a generic puzzle border.
const ACTIVITY_COVER_DEPICTION: Record<ActivityType, string> = {
  maze: "solving a big winding maze with a chunky pencil",
  "word-search": "circling hidden words in a letter-grid word search",
  crossword: "filling in a crossword puzzle",
  "letter-tracing": "tracing big alphabet letters A B C on a lined worksheet",
  "number-tracing": "tracing big numbers 1 2 3 on a worksheet",
  "sight-word-tracing": "tracing simple words on a lined worksheet",
  "dot-to-dot": "connecting numbered dots to reveal a picture",
  matching: "drawing lines to match pairs of pictures",
  counting: "counting cute objects and writing the number",
  "seek-and-find": "searching a busy scene with a magnifying glass",
  "color-by-number": "coloring a picture by number with crayons",
  "spot-difference": "spotting differences between two pictures",
  shapes: "tracing shapes — a circle, square and triangle",
  patterns: "finishing a row of repeating shapes",
  sorting: "circling the picture that is different",
  opposites: "matching opposite words like big and small",
  "color-reference": "coloring a picture to match a colorful reference",
};

// Short noun label per activity, for building the cover title.
const ACTIVITY_TITLE_LABEL: Record<ActivityType, string> = {
  maze: "Mazes",
  "word-search": "Word Search",
  crossword: "Crosswords",
  "letter-tracing": "Letter Tracing",
  "number-tracing": "Number Tracing",
  "sight-word-tracing": "Sight Words",
  "dot-to-dot": "Dot-to-Dot",
  matching: "Matching",
  counting: "Counting",
  "seek-and-find": "Seek & Find",
  "color-by-number": "Color by Number",
  "spot-difference": "Spot the Difference",
  shapes: "Shapes",
  patterns: "Patterns",
  sorting: "Sorting",
  opposites: "Opposites",
  "color-reference": "Color by Reference",
};

export interface ActivityTypeCount {
  type: ActivityType;
  count: number;
}

function capWords(s: string): string {
  return s.replace(/\b\w/g, (m) => m.toUpperCase());
}

// Cover title built from the 1-2 dominant activities, keeping the theme word
// when it's specific (e.g. "Ocean Letter Tracing", "Mazes & Word Search").
export function buildActivityCoverTitle(
  counts: ActivityTypeCount[],
  theme: string,
): string | null {
  const focus = counts.filter((c) => c.count > 0).slice(0, 2);
  if (!focus.length) return null;
  const labels = focus.map((c) => ACTIVITY_TITLE_LABEL[c.type]);
  const phrase = labels.length === 1 ? labels[0] : `${labels[0]} & ${labels[1]}`;
  const t = theme.trim();
  const generic = !t || /^(fun|activity|kids|activities)$/i.test(t);
  return generic ? `${phrase} Activity Book` : `${capWords(t)} ${phrase}`;
}

// Builds a cover scene focused on the 1-2 activity types with the most pages,
// keeping the book's original theme as context. Single-activity books show that
// one activity; mixed books show the top two by page count.
export function buildActivityCoverScene(
  counts: ActivityTypeCount[],
  themeContext: string,
): string {
  const focus = counts.filter((c) => c.count > 0).slice(0, 2);
  if (!focus.length) return themeContext;
  const deps = focus.map((c) => ACTIVITY_COVER_DEPICTION[c.type] ?? "doing a fun activity");
  const action =
    deps.length === 1
      ? `a happy child ${deps[0]}`
      : `one happy child ${deps[0]} and another happy child ${deps[1]}`;
  return `A vibrant kids' activity-book cover showing ${action} — make these activities the clear visual focus. Keep it on-theme with: ${themeContext}`;
}
