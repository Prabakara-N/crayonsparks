import type { ActivityResult, ActivitySpec } from "./types";
import { buildTracingPage } from "./tracing-shared";

export function generateNumberTracing(spec: ActivitySpec, assetDataUrl?: string): ActivityResult {
  const num = String(spec.params.numbers?.[0] ?? 1).slice(0, 2);
  const word = spec.params.referenceWord?.trim();
  const hasRef = !!assetDataUrl && !!word;
  return buildTracingPage(
    spec,
    {
      headerLine: num,
      traceLine: num,
      instruction: `Trace the number ${num}, then write your own.`,
      repeatTrace: true,
      rows: hasRef ? 4 : 5,
      referenceWord: word,
    },
    assetDataUrl,
  );
}
