import type {
  ActivityGenerator,
  ActivityResult,
  ActivitySpec,
  ActivityType,
} from "./types";
import { generateMaze } from "./maze";
import { generateWordSearch } from "./word-search";
import { generateCrossword } from "./crossword";
import { generateLetterTracing } from "./letter-tracing";
import { generateNumberTracing } from "./number-tracing";
import { generateSightWordTracing } from "./sight-word-tracing";
import { generateDotToDot } from "./dot-to-dot";
import { generateMatching } from "./matching";
import { generateCounting } from "./counting";
import { generateSeekAndFind } from "./seek-and-find";
import { generateColorByNumber } from "./color-by-number";
import { generateSpotDifference } from "./spot-difference";
import { generateShapes } from "./shapes";
import { generatePatterns } from "./patterns";
import { generateSorting } from "./sorting";
import { generateOpposites } from "./opposites";
import { generateColorReference } from "./color-reference";

function proc(type: ActivityType, fn: (s: ActivitySpec) => ActivityResult): ActivityGenerator {
  return { type, isProcedural: true, generate: (spec) => fn(spec) };
}

function illus(type: ActivityType, fn: (s: ActivitySpec, asset?: string) => ActivityResult): ActivityGenerator {
  return { type, isProcedural: false, generate: (spec, asset) => fn(spec, asset) };
}

export const ACTIVITY_GENERATORS: Partial<Record<ActivityType, ActivityGenerator>> = {
  maze: proc("maze", generateMaze),
  "word-search": proc("word-search", generateWordSearch),
  crossword: proc("crossword", generateCrossword),
  "letter-tracing": { type: "letter-tracing", isProcedural: true, generate: (spec, asset) => generateLetterTracing(spec, asset) },
  "number-tracing": proc("number-tracing", generateNumberTracing),
  "sight-word-tracing": proc("sight-word-tracing", generateSightWordTracing),
  "dot-to-dot": proc("dot-to-dot", generateDotToDot),
  matching: proc("matching", generateMatching),
  counting: proc("counting", generateCounting),
  "seek-and-find": illus("seek-and-find", generateSeekAndFind),
  "color-by-number": illus("color-by-number", generateColorByNumber),
  "spot-difference": illus("spot-difference", generateSpotDifference),
  shapes: proc("shapes", generateShapes),
  patterns: proc("patterns", generatePatterns),
  sorting: proc("sorting", generateSorting),
  opposites: proc("opposites", generateOpposites),
  "color-reference": illus("color-reference", generateColorReference),
};

export function getActivityGenerator(type: ActivityType): ActivityGenerator | undefined {
  return ACTIVITY_GENERATORS[type];
}

export function isProceduralType(type: ActivityType): boolean {
  return ACTIVITY_GENERATORS[type]?.isProcedural ?? false;
}

export type { ActivityGenerator, ActivityResult, ActivitySpec, ActivityType };
