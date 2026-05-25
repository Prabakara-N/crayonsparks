"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type StoryType } from "@/lib/story-book-planner";
import type { DialogueStyle } from "@/lib/prompts";
import {
  getAuthIdToken,
  redirectToLogin,
} from "@/lib/auth/require-auth-for-action";
import { readJsonOrThrow } from "@/lib/fetch-json";
import { useAuthContext } from "@/components/auth/auth-provider";
import {
  savePendingAction,
  consumePendingAction,
} from "@/lib/auth/pending-action";
import type {
  AgeRange,
  Aspect,
  DetailLevel,
  Phase,
  Plan,
  PromptItem,
} from "../types";

interface UseBookPlanArgs {
  initialPlan?: Plan;
  initialAge?: AgeRange;
  initialReference?: string;
  initialMode?: "qa" | "story";
  setPhase: (p: Phase) => void;
  setItems: (items: PromptItem[]) => void;
  setCoverPending: () => void;
  setCurrentIndex: (n: number) => void;
}

export function useBookPlan({
  initialPlan,
  initialAge,
  initialReference,
  initialMode,
  setPhase,
  setItems,
  setCoverPending,
  setCurrentIndex,
}: UseBookPlanArgs) {
  const [idea, setIdea] = useState("");
  const [pageCount, setPageCount] = useState(initialPlan?.prompts.length ?? 20);
  const [age, setAge] = useState<AgeRange>(initialAge ?? "toddlers");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>(
    initialPlan?.detailLevel ?? "simple",
  );
  const [aspectRatio, setAspectRatio] = useState<Aspect>("3:4");
  const [reference, setReference] = useState<string | null>(
    initialReference ?? null,
  );
  const [mode, setMode] = useState<"qa" | "story">(initialMode ?? "qa");
  const [bookKind, setBookKind] = useState<"coloring" | "story">("coloring");
  const [storyType, setStoryType] = useState<StoryType | null>(
    initialPlan?.storyType ?? null,
  );
  const [storyCharacterNames, setStoryCharacterNames] = useState<string>("");
  const [dialogueStyle, setDialogueStyle] = useState<DialogueStyle>(
    initialPlan?.dialogueStyle ?? "balanced",
  );

  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(initialPlan ?? null);

  const { user, loading: authLoading } = useAuthContext();
  const [pendingPlan, setPendingPlan] = useState(false);
  const restoredRef = useRef(false);

  const runPlan = useCallback(async (regenerationHint?: unknown) => {
    const trimmed = idea.trim();
    if (trimmed.length < 10) {
      setPlanError(
        bookKind === "story"
          ? "Describe the story in at least 10 characters."
          : "Describe the book in at least 10 characters.",
      );
      return;
    }
    const hint =
      typeof regenerationHint === "string" && regenerationHint.trim()
        ? regenerationHint.trim()
        : undefined;
    const idToken = await getAuthIdToken();
    if (!idToken) {
      savePendingAction({
        type: "bulk-book",
        returnTo: "/playground?tab=bulk-book",
        payload: {
          idea: trimmed,
          pageCount,
          age,
          detailLevel,
          aspectRatio,
          mode,
          bookKind,
          storyType,
          storyCharacterNames,
          dialogueStyle,
        },
      });
      redirectToLogin("/playground?tab=bulk-book");
      return;
    }
    setPlanError(null);
    setPlanning(true);
    setPhase("planning");
    try {
      const isStoryPlan = bookKind === "story";
      const endpoint = isStoryPlan
        ? "/api/plan-story-book"
        : "/api/plan-book";
      const body = isStoryPlan
        ? {
          idea: trimmed,
          pageCount,
          age,
          storyType: storyType ?? undefined,
          characterNames: storyCharacterNames.trim() || undefined,
          dialogueStyle,
          regenerationHint: hint,
        }
        : { idea: trimmed, pageCount, age, regenerationHint: hint };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });
      const json = await readJsonOrThrow<{ plan?: Plan; error?: string }>(res);
      if (!json.plan) throw new Error(json.error || "Planning failed");
      setMode(isStoryPlan ? "story" : "qa");
      setPlan(json.plan);
      setItems(
        json.plan.prompts.map((p, i) => ({
          id: `p${String(i + 1).padStart(2, "0")}`,
          name: p.name,
          subject: p.subject,
          status: "pending",
          dialogue: p.dialogue,
          narration: p.narration,
          composition: p.composition,
        })),
      );
      setCoverPending();
      setCurrentIndex(0);
      setPhase("review");
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : "Failed to plan book");
      setPhase("idea");
    } finally {
      setPlanning(false);
    }
  }, [
    idea,
    pageCount,
    age,
    bookKind,
    storyType,
    storyCharacterNames,
    dialogueStyle,
    detailLevel,
    aspectRatio,
    mode,
    setPhase,
    setItems,
    setCoverPending,
    setCurrentIndex,
  ]);

  // Restore a bulk-book draft saved before a login redirect; auto-run the
  // plan if the user has since signed in.
  useEffect(() => {
    if (authLoading || restoredRef.current) return;
    restoredRef.current = true;
    const action = consumePendingAction("bulk-book");
    const p = action?.payload as
      | Partial<{
          idea: string;
          pageCount: number;
          age: AgeRange;
          detailLevel: DetailLevel;
          aspectRatio: Aspect;
          mode: "qa" | "story";
          bookKind: "coloring" | "story";
          storyType: StoryType | null;
          storyCharacterNames: string;
          dialogueStyle: DialogueStyle;
        }>
      | undefined;
    if (!p) return;
    if (p.idea) setIdea(p.idea);
    if (p.pageCount) setPageCount(p.pageCount);
    if (p.age) setAge(p.age);
    if (p.detailLevel) setDetailLevel(p.detailLevel);
    if (p.aspectRatio) setAspectRatio(p.aspectRatio);
    if (p.mode) setMode(p.mode);
    if (p.bookKind) setBookKind(p.bookKind);
    if (p.storyType !== undefined) setStoryType(p.storyType);
    if (typeof p.storyCharacterNames === "string") {
      setStoryCharacterNames(p.storyCharacterNames);
    }
    if (p.dialogueStyle) setDialogueStyle(p.dialogueStyle);
    if (user) setPendingPlan(true);
  }, [authLoading, user]);

  useEffect(() => {
    if (pendingPlan && idea.trim().length >= 10) {
      setPendingPlan(false);
      void runPlan();
    }
  }, [pendingPlan, idea, runPlan]);

  return {
    idea,
    setIdea,
    pageCount,
    setPageCount,
    age,
    setAge,
    detailLevel,
    setDetailLevel,
    aspectRatio,
    setAspectRatio,
    reference,
    setReference,
    mode,
    setMode,
    bookKind,
    setBookKind,
    storyType,
    setStoryType,
    storyCharacterNames,
    setStoryCharacterNames,
    dialogueStyle,
    setDialogueStyle,
    planning,
    planError,
    plan,
    setPlan,
    runPlan,
  };
}
