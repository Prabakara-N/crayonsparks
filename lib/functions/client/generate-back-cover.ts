"use client";

import type { ImageModel } from "@/lib/constants";
import type { Plan, QualityScore } from "@/components/playground/book-studio/types";
import { deriveStoryBackCoverTagline } from "@/components/playground/book-studio/book-studio-helpers";
import type { CoverResult } from "./generate-cover";

export interface GenerateBackCoverArgs {
  plan: Plan;
  mode: "qa" | "story";
  age: "toddlers" | "kids" | "tweens";
  coverStyle: "flat" | "illustrated";
  coverBorder: "framed" | "bleed";
  coverDataUrl: string;
  qualityCheck: boolean;
  coverModel: ImageModel;
  signal?: AbortSignal;
}

export async function generateBackCover(
  args: GenerateBackCoverArgs,
): Promise<CoverResult> {
  if (args.mode === "story") {
    if (!args.plan.palette || args.plan.palette.hexes.length < 3) {
      throw new Error(
        "Story brief is missing a locked palette. Re-run the chat to regenerate the brief.",
      );
    }
    const res = await fetch("/api/generate-story-back-cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: args.signal,
      body: JSON.stringify({
        ageBand: args.age,
        title: args.plan.coverTitle,
        palette: args.plan.palette,
        tagline: deriveStoryBackCoverTagline(args.plan),
        coverReferenceDataUrl: args.coverDataUrl,
        model: args.coverModel,
      }),
    });
    const json = (await res.json()) as { dataUrl?: string; error?: string };
    if (!res.ok || !json.dataUrl) {
      throw new Error(json.error || "Story back cover failed");
    }
    return { dataUrl: json.dataUrl, quality: null, model: args.coverModel };
  }

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: args.signal,
    body: JSON.stringify({
      mode: "back-cover",
      coverTitle: args.plan.coverTitle,
      coverScene: args.plan.coverScene,
      backCoverDescription: args.plan.description,
      coverStyle: args.coverStyle,
      coverBorder: args.coverBorder,
      referenceDataUrl: args.coverDataUrl,
      qualityGate: args.qualityCheck,
      model: args.coverModel,
    }),
  });
  const json = (await res.json()) as {
    dataUrl?: string;
    error?: string;
    quality?: QualityScore | null;
  };
  if (!res.ok || !json.dataUrl)
    throw new Error(json.error || "Back cover failed");
  return {
    dataUrl: json.dataUrl,
    quality: json.quality ?? null,
    model: args.coverModel,
  };
}
