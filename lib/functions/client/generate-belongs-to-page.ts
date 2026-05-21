"use client";

import type { ImageModel } from "@/lib/constants";
import type { Plan, QualityScore } from "@/components/playground/book-studio/types";
import type { CoverResult } from "./generate-cover";

export interface GenerateBelongsToArgs {
  plan: Plan;
  belongsToStyle: "bw" | "color";
  /** Up to 3 page subjects pulled from the book's first interior pages. */
  characterSubjects: string;
  characterLockBlock?: string;
  coverDataUrl?: string;
  qualityCheck: boolean;
  interiorModel: ImageModel;
  signal?: AbortSignal;
}

export async function generateBelongsToPage(
  args: GenerateBelongsToArgs,
): Promise<CoverResult> {
  const characters =
    args.characterSubjects ||
    args.plan.coverScene ||
    "two friendly cartoon characters from the book";

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: args.signal,
    body: JSON.stringify({
      mode: "belongs-to",
      coverTitle: args.plan.coverTitle,
      belongsToCharacters: characters,
      belongsToStyle: args.belongsToStyle,
      model: args.interiorModel,
      characterLock: args.characterLockBlock,
      chainReferenceDataUrl: args.coverDataUrl,
      qualityGate: args.qualityCheck,
    }),
  });
  const json = (await res.json()) as {
    dataUrl?: string;
    error?: string;
    quality?: QualityScore | null;
  };
  if (!res.ok || !json.dataUrl)
    throw new Error(json.error || "Belongs-to page failed");
  return {
    dataUrl: json.dataUrl,
    quality: json.quality ?? null,
    model: args.interiorModel,
  };
}
