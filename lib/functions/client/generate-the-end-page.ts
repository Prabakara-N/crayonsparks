"use client";

import type { ImageModel } from "@/lib/constants";
import type { Plan, QualityScore } from "@/components/playground/book-studio/types";
import type { CoverResult } from "./generate-cover";

export interface GenerateTheEndArgs {
  plan: Plan;
  coverStyle: "flat" | "illustrated";
  coverBorder: "framed" | "bleed";
  coverDataUrl?: string;
  qualityCheck: boolean;
  interiorModel: ImageModel;
  signal?: AbortSignal;
}

export async function generateTheEndPage(
  args: GenerateTheEndArgs,
): Promise<CoverResult> {
  const message =
    args.plan.theEndMessage?.trim() ||
    "Thanks for reading — see you in the next story!";
  const paletteLine = args.plan.palette
    ? `${args.plan.palette.name} — ${args.plan.palette.hexes.join(", ")}`
    : undefined;

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: args.signal,
    body: JSON.stringify({
      mode: "the-end",
      coverTitle: args.plan.coverTitle,
      theEndMessage: message,
      theEndPaletteLine: paletteLine,
      theEndStoryType: args.plan.storyType,
      coverStyle: args.coverStyle,
      coverBorder: args.coverBorder,
      model: args.interiorModel,
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
    throw new Error(json.error || "The End page failed");
  return {
    dataUrl: json.dataUrl,
    quality: json.quality ?? null,
    model: args.interiorModel,
  };
}
