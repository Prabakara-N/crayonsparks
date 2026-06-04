export type ActivityType =
  | "maze"
  | "word-search"
  | "crossword"
  | "letter-tracing"
  | "number-tracing"
  | "sight-word-tracing"
  | "dot-to-dot"
  | "matching"
  | "counting"
  | "spot-difference"
  | "seek-and-find"
  | "color-by-number"
  | "shapes"
  | "patterns"
  | "sorting"
  | "opposites";

// Types the planner can include in a book (client-safe — no server deps,
// so the studio UI can import this without pulling in the Gemini SDK).
export const PLANNABLE_TYPES: ActivityType[] = [
  "maze",
  "word-search",
  "crossword",
  "letter-tracing",
  "number-tracing",
  "sight-word-tracing",
  "dot-to-dot",
  "matching",
  "counting",
  "seek-and-find",
  "color-by-number",
  "spot-difference",
  "shapes",
  "patterns",
  "sorting",
  "opposites",
];

export const ACTIVITY_TYPES: ActivityType[] = [
  "maze",
  "word-search",
  "crossword",
  "letter-tracing",
  "number-tracing",
  "sight-word-tracing",
  "dot-to-dot",
  "matching",
  "counting",
  "spot-difference",
  "seek-and-find",
  "color-by-number",
  "shapes",
  "patterns",
  "sorting",
  "opposites",
];

// Exact number of pages the user wants per activity type. Client-safe.
export type ActivityCounts = Partial<Record<ActivityType, number>>;

export type ActivityDifficulty = "easy" | "medium" | "hard";

export type ActivityAgeBand = "toddlers" | "kids" | "tweens";

// Discriminated per type — only the relevant fields are set.
export interface ActivityParams {
  seed?: number;
  gridSize?: number;
  words?: string[];
  clues?: { answer: string; clue: string }[];
  letters?: string[];
  numbers?: number[];
  phrase?: string;
  pointCount?: number;
  shape?: string;
  differenceCount?: number;
  findList?: { label: string; count: number }[];
  paletteLegend?: { n: number; label: string }[];
  lineStyle?: "straight" | "zigzag" | "curved";
  pairs?: { left: string; right: string }[];
  counts?: number[];
  icon?: string;
  iconNames?: string[];
  shapeNames?: string[];
  oppositePairs?: { left: string; right: string }[];
  dotPoints?: { x: number; y: number }[];
  referenceWord?: string;
  aiObjects?: string[];
  aiTrace?: boolean;
}

// What the planner produces per page; what the generator consumes.
export interface ActivitySpec {
  id: string;
  type: ActivityType;
  title: string;
  theme: string;
  difficulty: ActivityDifficulty;
  ageBand: ActivityAgeBand;
  params: ActivityParams;
}

export interface ActivityResult {
  svg: string;
  solutionSvg?: string;
  meta: Record<string, unknown>;
}

export interface ActivityGenerator {
  type: ActivityType;
  isProcedural: boolean;
  generate(spec: ActivitySpec, assetDataUrl?: string): ActivityResult;
}
