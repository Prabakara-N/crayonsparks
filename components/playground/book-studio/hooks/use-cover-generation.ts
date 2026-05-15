"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageModel } from "@/lib/constants";
import { DEFAULT_COVER_MODEL, DEFAULT_INTERIOR_MODEL } from "@/lib/constants";
import {
  AGE_LABELS,
} from "../book-studio-constants";
import {
  deriveStoryBackCoverTagline,
  isAbortError,
} from "../book-studio-helpers";
import type {
  AgeRange,
  CoverBorder,
  CoverStyle,
  Plan,
  PromptItem,
  QualityScore,
} from "../types";

interface CoverState {
  status: "pending" | "generating" | "done" | "error";
  dataUrl?: string;
  error?: string;
  quality?: QualityScore | null;
  model?: ImageModel;
}

interface UseCoverGenerationArgs {
  plan: Plan | null;
  initialPlan?: Plan;
  mode: "qa" | "story";
  age: AgeRange;
  itemsRef: React.MutableRefObject<PromptItem[]>;
  qualityCheck: boolean;
  characterLockBlockRef: React.MutableRefObject<string | undefined>;
  abortRef: React.MutableRefObject<AbortController | null>;
}

export function useCoverGeneration({
  plan,
  initialPlan,
  mode,
  age,
  itemsRef,
  qualityCheck,
  characterLockBlockRef,
  abortRef,
}: UseCoverGenerationArgs) {
  const [cover, setCover] = useState<CoverState>({ status: "pending" });
  const [backCover, setBackCover] = useState<CoverState>({ status: "pending" });
  const [belongsTo, setBelongsTo] = useState<CoverState>({ status: "pending" });

  const [coverStyle, setCoverStyle] = useState<CoverStyle>("illustrated");
  const [coverBorder, setCoverBorder] = useState<CoverBorder>("bleed");
  const [coverBadgeStyle, setCoverBadgeStyle] = useState<string>(
    initialPlan?.coverBadgeStyle ?? "",
  );
  const seededBadgeStyleForPlanRef = useRef<Plan | null>(initialPlan ?? null);
  const [belongsToStyle, setBelongsToStyle] = useState<"bw" | "color">("bw");

  const [coverModel, setCoverModel] =
    useState<ImageModel>(DEFAULT_COVER_MODEL);
  const [interiorModel, setInteriorModel] =
    useState<ImageModel>(DEFAULT_INTERIOR_MODEL);

  useEffect(() => {
    if (!plan) return;
    if (seededBadgeStyleForPlanRef.current === plan) return;
    seededBadgeStyleForPlanRef.current = plan;
    setCoverBadgeStyle(plan.coverBadgeStyle ?? "");
  }, [plan]);

  const generateCover = useCallback(async () => {
    if (!plan) return;
    setCover({ status: "generating" });
    try {
      if (mode === "story") {
        if (!plan.characters?.length) {
          throw new Error(
            "Story brief is missing locked characters. Re-run the chat to regenerate the brief.",
          );
        }
        if (!plan.palette || plan.palette.hexes.length < 3) {
          throw new Error(
            "Story brief is missing a locked palette. Re-run the chat to regenerate the brief.",
          );
        }
        const res = await fetch("/api/generate-story-cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current?.signal,
          body: JSON.stringify({
            ageBand: age,
            title: plan.coverTitle,
            coverScene: plan.coverScene,
            characters: plan.characters,
            palette: plan.palette,
            audienceLabel: AGE_LABELS[age],
            pageCount: itemsRef.current.length,
            bottomStripPhrases: plan.bottomStripPhrases,
            sidePlaqueLines: plan.sidePlaqueLines,
            coverBadgeStyle: coverBadgeStyle.trim() || plan.coverBadgeStyle,
            model: coverModel,
            coverStyle,
            coverBorder,
          }),
        });
        const json = (await res.json()) as { dataUrl?: string; error?: string };
        if (!res.ok || !json.dataUrl) {
          throw new Error(json.error || "Story cover failed");
        }
        setCover({
          status: "done",
          dataUrl: json.dataUrl,
          quality: null,
          model: coverModel,
        });
        return;
      }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current?.signal,
        body: JSON.stringify({
          mode: "cover",
          coverTitle: plan.coverTitle,
          coverScene: plan.coverScene,
          coverStyle,
          coverBorder,
          pageCount: itemsRef.current.length,
          bottomStripPhrases: plan.bottomStripPhrases,
          sidePlaqueLines: plan.sidePlaqueLines,
          coverBadgeStyle: coverBadgeStyle.trim() || plan.coverBadgeStyle,
          qualityGate: qualityCheck,
          model: coverModel,
        }),
      });
      const json = (await res.json()) as {
        dataUrl?: string;
        error?: string;
        quality?: QualityScore | null;
      };
      if (!res.ok || !json.dataUrl) throw new Error(json.error || "Cover failed");
      setCover({
        status: "done",
        dataUrl: json.dataUrl,
        quality: json.quality ?? null,
        model: coverModel,
      });
    } catch (e) {
      if (isAbortError(e)) {
        setCover({ status: "pending" });
        return;
      }
      setCover({
        status: "error",
        error: e instanceof Error ? e.message : "Cover failed",
      });
      throw e;
    }
  }, [
    plan,
    mode,
    age,
    coverStyle,
    coverBorder,
    coverBadgeStyle,
    itemsRef,
    qualityCheck,
    coverModel,
    abortRef,
  ]);

  const generateBackCover = useCallback(async () => {
    if (!plan) return;
    if (!cover.dataUrl) {
      setBackCover({
        status: "error",
        error:
          "Generate the front cover first — back cover matches its style.",
      });
      return;
    }
    setBackCover({ status: "generating" });
    try {
      if (mode === "story") {
        if (!plan.palette || plan.palette.hexes.length < 3) {
          throw new Error(
            "Story brief is missing a locked palette. Re-run the chat to regenerate the brief.",
          );
        }
        const res = await fetch("/api/generate-story-back-cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current?.signal,
          body: JSON.stringify({
            ageBand: age,
            title: plan.coverTitle,
            palette: plan.palette,
            tagline: deriveStoryBackCoverTagline(plan),
            coverReferenceDataUrl: cover.dataUrl,
            model: coverModel,
          }),
        });
        const json = (await res.json()) as { dataUrl?: string; error?: string };
        if (!res.ok || !json.dataUrl) {
          throw new Error(json.error || "Story back cover failed");
        }
        setBackCover({
          status: "done",
          dataUrl: json.dataUrl,
          quality: null,
          model: coverModel,
        });
        return;
      }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current?.signal,
        body: JSON.stringify({
          mode: "back-cover",
          coverTitle: plan.coverTitle,
          coverScene: plan.coverScene,
          backCoverDescription: plan.description,
          coverStyle,
          coverBorder,
          referenceDataUrl: cover.dataUrl,
          qualityGate: qualityCheck,
          model: coverModel,
        }),
      });
      const json = (await res.json()) as {
        dataUrl?: string;
        error?: string;
        quality?: QualityScore | null;
      };
      if (!res.ok || !json.dataUrl)
        throw new Error(json.error || "Back cover failed");
      setBackCover({
        status: "done",
        dataUrl: json.dataUrl,
        quality: json.quality ?? null,
        model: coverModel,
      });
    } catch (e) {
      if (isAbortError(e)) {
        setBackCover({ status: "pending" });
        return;
      }
      setBackCover({
        status: "error",
        error: e instanceof Error ? e.message : "Back cover failed",
      });
    }
  }, [
    plan,
    mode,
    cover.dataUrl,
    coverStyle,
    coverBorder,
    qualityCheck,
    coverModel,
    age,
    abortRef,
  ]);

  const generateBelongsToPage = useCallback(async () => {
    if (!plan) return;
    setBelongsTo({ status: "generating" });
    try {
      const characterSubjects = itemsRef.current
        .slice(0, 3)
        .map((it) => it.subject)
        .filter(Boolean)
        .join("; ");
      const characters =
        characterSubjects ||
        plan.coverScene ||
        "two friendly cartoon characters from the book";
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current?.signal,
        body: JSON.stringify({
          mode: "belongs-to",
          coverTitle: plan.coverTitle,
          belongsToCharacters: characters,
          belongsToStyle,
          model: interiorModel,
          characterLock: characterLockBlockRef.current,
          chainReferenceDataUrl: cover.dataUrl,
          qualityGate: qualityCheck,
        }),
      });
      const json = (await res.json()) as {
        dataUrl?: string;
        error?: string;
        quality?: QualityScore | null;
      };
      if (!res.ok || !json.dataUrl)
        throw new Error(json.error || "Belongs-to page failed");
      setBelongsTo({
        status: "done",
        dataUrl: json.dataUrl,
        quality: json.quality ?? null,
        model: interiorModel,
      });
    } catch (e) {
      if (isAbortError(e)) {
        setBelongsTo({ status: "pending" });
        return;
      }
      setBelongsTo({
        status: "error",
        error: e instanceof Error ? e.message : "Belongs-to page failed",
      });
    }
  }, [
    plan,
    itemsRef,
    belongsToStyle,
    qualityCheck,
    characterLockBlockRef,
    cover.dataUrl,
    interiorModel,
    abortRef,
  ]);

  return {
    cover,
    setCover,
    backCover,
    setBackCover,
    belongsTo,
    setBelongsTo,
    coverStyle,
    setCoverStyle,
    coverBorder,
    setCoverBorder,
    coverBadgeStyle,
    setCoverBadgeStyle,
    belongsToStyle,
    setBelongsToStyle,
    coverModel,
    setCoverModel,
    interiorModel,
    setInteriorModel,
    generateCover,
    generateBackCover,
    generateBelongsToPage,
  };
}
