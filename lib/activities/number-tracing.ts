import type { ActivityResult, ActivitySpec } from "./types";
import { buildTracingPage } from "./tracing-shared";

export function generateNumberTracing(spec: ActivitySpec): ActivityResult {
  const nums = (spec.params.numbers?.length ? spec.params.numbers : [1])
    .map((n) => String(n))
    .slice(0, 10);
  const isRange = nums.length > 1;
  const line = nums.join(" ");
  return buildTracingPage(spec, {
    headerLine: line,
    traceLine: line,
    instruction: isRange
      ? `Trace numbers ${nums[0]} to ${nums[nums.length - 1]}, then write your own.`
      : `Trace the number ${nums[0]}, then write your own.`,
    repeatTrace: !isRange,
    rows: 5,
  });
}
