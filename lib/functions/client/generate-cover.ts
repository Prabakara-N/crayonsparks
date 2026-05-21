"use client";

import type { ImageModel } from "@/lib/constants";
import type { Plan, QualityScore } from "@/components/playground/book-studio/types";

export interface GenerateCoverArgs {
  plan: Plan;
  mode: "qa" | "story";
  age: "toddlers" | "kids" | "tweens";
  ageLabel: string;
  coverStyle: "flat" | "illustrated";
  coverBorder: "framed" | "bleed";
  coverBadgeStyle: string;
  pageCount: number;
  qualityCheck: boolean;
  coverModel: ImageModel;
  signal?: AbortSignal;
}

export interface CoverResult {
  dataUrl: string;
  quality: QualityScore | null;
  model: ImageModel;
}

export async function generateCover(args: GenerateCoverArgs): Promise<CoverResult> {
  if (args.mode === "story") {
    if (!args.plan.characters?.length) {
      throw new Error(
        "Story brief is missing locked characters. Re-run the chat to regenerate the brief.",
      );
    }
    if (!args.plan.palette || args.plan.palette.hexes.length < 3) {
      throw new Error(
        "Story brief is missing a locked palette. Re-run the chat to regenerate the brief.",
      );
    }
    const res = await fetch("/api/generate-story-cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: args.signal,
      body: JSON.stringify({
        ageBand: args.age,
        title: args.plan.coverTitle,
        coverScene: args.plan.coverScene,
        characters: args.plan.characters,
        palette: args.plan.palette,
        audienceLabel: args.ageLabel,
        pageCount: args.pageCount,
        bottomStripPhrases: args.plan.bottomStripPhrases,
        sidePlaqueLines: args.plan.sidePlaqueLines,
        coverBadgeStyle:
          args.coverBadgeStyle.trim() || args.plan.coverBadgeStyle,
        model: args.coverModel,
        coverStyle: args.coverStyle,
        coverBorder: args.coverBorder,
      }),
    });
    const json = (await res.json()) as { dataUrl?: string; error?: string };
    if (!res.ok || !json.dataUrl) throw new Error(json.error || "Story cover failed");
    return { dataUrl: json.dataUrl, quality: null, model: args.coverModel };
  }

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: args.signal,
    body: JSON.stringify({
      mode: "cover",
      coverTitle: args.plan.coverTitle,
      coverScene: args.plan.coverScene,
      coverStyle: args.coverStyle,
      coverBorder: args.coverBorder,
      pageCount: args.pageCount,
      bottomStripPhrases: args.plan.bottomStripPhrases,
      sidePlaqueLines: args.plan.sidePlaqueLines,
      coverBadgeStyle: args.coverBadgeStyle.trim() || args.plan.coverBadgeStyle,
      qualityGate: args.qualityCheck,
      model: args.coverModel,
    }),
  });
  const json = (await res.json()) as {
    dataUrl?: string;
    error?: string;
    quality?: QualityScore | null;
  };
  if (!res.ok || !json.dataUrl) throw new Error(json.error || "Cover failed");
  return {
    dataUrl: json.dataUrl,
    quality: json.quality ?? null,
    model: args.coverModel,
  };
}
