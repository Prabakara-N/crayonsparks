"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ImageModel } from "@/lib/constants";
import { DEFAULT_COVER_MODEL, DEFAULT_INTERIOR_MODEL } from "@/lib/constants";
import { useDialog } from "@/components/ui/confirm-dialog";
import { emitCreditsChanged } from "@/lib/credits-events";
import { AGE_LABELS } from "../book-studio-constants";
import { isAbortError } from "../book-studio-helpers";
import {
  isCreditsError,
  precheckCredits,
  showCreditsExhaustedDialog,
} from "../credits-error";
import { creditCost, type BookKind } from "@/lib/credits/costs";
import { generateCover as runGenerateCover } from "@/lib/functions/client/generate-cover";
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
  bookKind?: "coloring" | "story" | "activity";
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
  bookKind,
  age,
  itemsRef,
  qualityCheck,
  characterLockBlockRef,
  abortRef,
}: UseCoverGenerationArgs) {
  const dialog = useDialog();
  const router = useRouter();
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
    const kind: BookKind =
      bookKind === "activity" ? "activity" : mode === "story" ? "story" : "coloring";
    const ok = await precheckCredits(
      creditCost(kind, "cover"),
      dialog,
      router,
    );
    if (!ok) {
      setCover({ status: "pending" });
      return;
    }
    try {
      const result = await runGenerateCover({
        plan,
        mode,
        bookKind,
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
      emitCreditsChanged();
    } catch (e) {
      if (isAbortError(e)) {
        setCover({ status: "pending" });
        return;
      }
      const message = e instanceof Error ? e.message : "Cover failed";
      if (isCreditsError(message)) {
        setCover({ status: "pending" });
        void showCreditsExhaustedDialog(dialog, router);
        return;
      }
      setCover({ status: "error", error: message });
      throw e;
    }
  }, [
    plan,
    mode,
    bookKind,
    age,
    coverStyle,
    coverBorder,
    coverBadgeStyle,
    itemsRef,
    qualityCheck,
    coverModel,
    abortRef,
    dialog,
    router,
  ]);

  const generateBelongsToPage = useCallback(async () => {
    if (!plan) return;
    setBelongsTo({ status: "generating" });
    const kind: BookKind = mode === "story" ? "story" : "coloring";
    const ok = await precheckCredits(
      creditCost(kind, "page"),
      dialog,
      router,
    );
    if (!ok) {
      setBelongsTo({ status: "pending" });
      return;
    }
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
      emitCreditsChanged();
    } catch (e) {
      if (isAbortError(e)) {
        setBelongsTo({ status: "pending" });
        return;
      }
      const message =
        e instanceof Error ? e.message : "Belongs-to page failed";
      if (isCreditsError(message)) {
        setBelongsTo({ status: "pending" });
        void showCreditsExhaustedDialog(dialog, router);
        return;
      }
      setBelongsTo({ status: "error", error: message });
    }
  }, [
    plan,
    mode,
    itemsRef,
    belongsToStyle,
    qualityCheck,
    characterLockBlockRef,
    cover.dataUrl,
    interiorModel,
    abortRef,
    dialog,
    router,
  ]);

  const generateTheEndPage = useCallback(async () => {
    if (!plan) return;
    setTheEndPage({ status: "generating" });
    const kind: BookKind = mode === "story" ? "story" : "coloring";
    const ok = await precheckCredits(
      creditCost(kind, "page"),
      dialog,
      router,
    );
    if (!ok) {
      setTheEndPage({ status: "pending" });
      return;
    }
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
      emitCreditsChanged();
    } catch (e) {
      if (isAbortError(e)) {
        setTheEndPage({ status: "pending" });
        return;
      }
      const message = e instanceof Error ? e.message : "The End page failed";
      if (isCreditsError(message)) {
        setTheEndPage({ status: "pending" });
        void showCreditsExhaustedDialog(dialog, router);
        return;
      }
      setTheEndPage({ status: "error", error: message });
    }
  }, [
    plan,
    mode,
    qualityCheck,
    cover.dataUrl,
    interiorModel,
    coverStyle,
    coverBorder,
    abortRef,
    dialog,
    router,
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
    generateBelongsToPage,
    theEndPage,
    setTheEndPage,
    generateTheEndPage,
  };
}
