"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageModel } from "@/lib/constants";
import { DEFAULT_COVER_MODEL, DEFAULT_INTERIOR_MODEL } from "@/lib/constants";
import { AGE_LABELS } from "../book-studio-constants";
import { isAbortError } from "../book-studio-helpers";
import { generateCover as runGenerateCover } from "@/lib/functions/client/generate-cover";
import { generateBackCover as runGenerateBackCover } from "@/lib/functions/client/generate-back-cover";
import { generateBelongsToPage as runGenerateBelongsTo } from "@/lib/functions/client/generate-belongs-to-page";
import { generateTheEndPage as runGenerateTheEnd } from "@/lib/functions/client/generate-the-end-page";
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
  const [theEndPage, setTheEndPage] = useState<CoverState>({
    status: "pending",
  });

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
      const result = await runGenerateCover({
        plan,
        mode,
        age,
        ageLabel: AGE_LABELS[age],
        coverStyle,
        coverBorder,
        coverBadgeStyle,
        pageCount: itemsRef.current.length,
        qualityCheck,
        coverModel,
        signal: abortRef.current?.signal,
      });
      setCover({ status: "done", ...result });
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
      const result = await runGenerateBackCover({
        plan,
        mode,
        age,
        coverStyle,
        coverBorder,
        coverDataUrl: cover.dataUrl,
        qualityCheck,
        coverModel,
        signal: abortRef.current?.signal,
      });
      setBackCover({ status: "done", ...result });
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
      const result = await runGenerateBelongsTo({
        plan,
        belongsToStyle,
        characterSubjects,
        characterLockBlock: characterLockBlockRef.current,
        coverDataUrl: cover.dataUrl,
        qualityCheck,
        interiorModel,
        signal: abortRef.current?.signal,
      });
      setBelongsTo({ status: "done", ...result });
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

  const generateTheEndPage = useCallback(async () => {
    if (!plan) return;
    setTheEndPage({ status: "generating" });
    try {
      const result = await runGenerateTheEnd({
        plan,
        coverStyle,
        coverBorder,
        coverDataUrl: cover.dataUrl,
        qualityCheck,
        interiorModel,
        signal: abortRef.current?.signal,
      });
      setTheEndPage({ status: "done", ...result });
    } catch (e) {
      if (isAbortError(e)) {
        setTheEndPage({ status: "pending" });
        return;
      }
      setTheEndPage({
        status: "error",
        error: e instanceof Error ? e.message : "The End page failed",
      });
    }
  }, [
    plan,
    qualityCheck,
    cover.dataUrl,
    interiorModel,
    coverStyle,
    coverBorder,
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
    theEndPage,
    setTheEndPage,
    generateTheEndPage,
  };
}
