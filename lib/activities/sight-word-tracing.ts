import type { ActivityResult, ActivitySpec } from "./types";
import { buildTracingPage } from "./tracing-shared";

export function generateSightWordTracing(spec: ActivitySpec): ActivityResult {
  const phrase = (spec.params.phrase ?? "I can read").trim().slice(0, 40);
  return buildTracingPage(spec, {
    headerLine: phrase,
    traceLine: phrase,
    instruction: "Trace the words, then write them on your own.",
    repeatTrace: false,
    rows: 6,
  });
}
