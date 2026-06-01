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
import { generateCutLines } from "./cut-lines";
import { generateMatching } from "./matching";
import { generateCounting } from "./counting";
import { generateSeekAndFind } from "./seek-and-find";
import { generateColorByNumber } from "./color-by-number";
import { generateSpotDifference } from "./spot-difference";

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
  "letter-tracing": proc("letter-tracing", generateLetterTracing),
  "number-tracing": proc("number-tracing", generateNumberTracing),
  "sight-word-tracing": proc("sight-word-tracing", generateSightWordTracing),
  "dot-to-dot": proc("dot-to-dot", generateDotToDot),
  "cut-lines": proc("cut-lines", generateCutLines),
  matching: proc("matching", generateMatching),
  counting: proc("counting", generateCounting),
  "seek-and-find": illus("seek-and-find", generateSeekAndFind),
  "color-by-number": illus("color-by-number", generateColorByNumber),
  "spot-difference": illus("spot-difference", generateSpotDifference),
};

export function getActivityGenerator(type: ActivityType): ActivityGenerator | undefined {
  return ACTIVITY_GENERATORS[type];
}

export function isProceduralType(type: ActivityType): boolean {
  return ACTIVITY_GENERATORS[type]?.isProcedural ?? false;
}

export type { ActivityGenerator, ActivityResult, ActivitySpec, ActivityType };
