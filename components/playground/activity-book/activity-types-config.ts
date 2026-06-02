import {
  Calculator,
  Grid3x3,
  Hash,
  Link2,
  PenLine,
  Route,
  Search,
  Spline,
  Type,
  type LucideIcon,
} from "lucide-react";
import { PLANNABLE_TYPES, type ActivityType } from "@/lib/activities/types";

export interface ActivityTypeMeta {
  type: ActivityType;
  label: string;
  icon: LucideIcon;
  blurb: string;
}

export const ACTIVITY_TYPE_META: Record<ActivityType, ActivityTypeMeta> = {
  maze: { type: "maze", label: "Maze", icon: Route, blurb: "Find the path from start to end" },
  "word-search": { type: "word-search", label: "Word Search", icon: Search, blurb: "Hidden words in a letter grid" },
  crossword: { type: "crossword", label: "Crossword", icon: Grid3x3, blurb: "Solve clues to fill the grid" },
  "letter-tracing": { type: "letter-tracing", label: "Letter Tracing", icon: Type, blurb: "Trace ABCs on ruled lines" },
  "number-tracing": { type: "number-tracing", label: "Number Tracing", icon: Hash, blurb: "Trace 0-9 on ruled lines" },
  "sight-word-tracing": { type: "sight-word-tracing", label: "Sight Words", icon: PenLine, blurb: "Trace common words & phrases" },
  "dot-to-dot": { type: "dot-to-dot", label: "Dot to Dot", icon: Spline, blurb: "Connect numbered dots" },
  matching: { type: "matching", label: "Matching", icon: Link2, blurb: "Draw lines to match pairs" },
  counting: { type: "counting", label: "Counting", icon: Calculator, blurb: "Count shapes and write" },
  "spot-difference": { type: "spot-difference", label: "Spot the Difference", icon: Search, blurb: "Find added details between two scenes (AI)" },
  "seek-and-find": { type: "seek-and-find", label: "Seek & Find", icon: Search, blurb: "Find & count items in a scene (AI)" },
  "color-by-number": { type: "color-by-number", label: "Color by Number", icon: Grid3x3, blurb: "Color regions by a number key (AI)" },
};

export const PLANNABLE_TYPE_META: ActivityTypeMeta[] = PLANNABLE_TYPES.map(
  (t) => ACTIVITY_TYPE_META[t],
);
