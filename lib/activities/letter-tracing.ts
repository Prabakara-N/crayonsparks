import type { ActivityResult, ActivitySpec } from "./types";
import { buildTracingPage } from "./tracing-shared";

export function generateLetterTracing(spec: ActivitySpec, assetDataUrl?: string): ActivityResult {
  const letter = (spec.params.letters?.[0] ?? "A").toUpperCase().slice(0, 1);
  const upper = letter;
  const lower = letter.toLowerCase();
  const word = spec.params.referenceWord?.trim();
  const hasRef = !!assetDataUrl && !!word;
  return buildTracingPage(
    spec,
    {
      headerLine: `${upper} ${lower}`,
      traceLine: `${upper}${lower}`,
      instruction: `Trace the letter ${upper}, then write your own.`,
      repeatTrace: true,
      rows: hasRef ? 4 : 5,
      referenceWord: word,
    },
    assetDataUrl,
  );
}
