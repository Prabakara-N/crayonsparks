"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ImageModel } from "@/lib/constants";
import { useDialog } from "@/components/ui/confirm-dialog";
import { readJsonOrThrow } from "@/lib/fetch-json";
import { downscaleReferenceImage } from "@/lib/functions/client/downscale-image";
import { isAbortError, shareKeyNoun } from "../book-studio-helpers";
import {
  isCreditsError,
  showCreditsExhaustedDialog,
} from "../credits-error";
import type {
  AgeRange,
  Aspect,
  CoverStyle,
  DetailLevel,
  Phase,
  Plan,
  PromptItem,
} from "../types";

interface CoverSnapshot {
  status: "pending" | "generating" | "done" | "error";
  dataUrl?: string;
}

interface UsePageGenerationArgs {
  plan: Plan | null;
  initialPlan?: Plan;
  mode: "qa" | "story";
  age: AgeRange;
  aspectRatio: Aspect;
  detailLevel: DetailLevel;
  reference: string | null;
  qualityCheck: boolean;
  interiorModel: ImageModel;
  coverStyle: CoverStyle;
  cover: CoverSnapshot;
  characterLockStatus: "pending" | "extracting" | "done" | "error";
  characterLockBlock: string | undefined;
  extractCharacterLock: () => Promise<void>;
  setPhase: (p: Phase) => void;
  abortRef: React.MutableRefObject<AbortController | null>;
  itemsRef: React.MutableRefObject<PromptItem[]>;
}

export function usePageGeneration({
  plan,
  initialPlan,
  mode,
  age,
  aspectRatio,
  detailLevel,
  reference,
  qualityCheck,
  interiorModel,
  coverStyle,
  cover,
  characterLockStatus,
  characterLockBlock,
  extractCharacterLock,
  setPhase,
  abortRef,
  itemsRef,
}: UsePageGenerationArgs) {
  const dialog = useDialog();
  const router = useRouter();

  const [items, setItems] = useState<PromptItem[]>(
    initialPlan
      ? initialPlan.prompts.map((p, i) => ({
        id: `seed.${String(i + 1).padStart(2, "0")}`,
        name: p.name,
        subject: p.subject,
        status: "pending" as const,
        dialogue: p.dialogue,
        narration: p.narration,
        composition: p.composition,
      }))
      : [],
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const pausedRef = useRef(false);
  const cancelRef = useRef(false);
  const runningRef = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  });

  const updateItem = useCallback(
    (id: string, patch: Partial<PromptItem>) =>
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      ),
    [],
  );

  const updatePromptText = useCallback(
    (id: string, patch: { name?: string; subject?: string }) =>
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      ),
    [],
  );

  const removeItem = useCallback(
    (id: string) => setItems((prev) => prev.filter((it) => it.id !== id)),
    [],
  );

  const generatePage = useCallback(
    async (
      item: PromptItem,
      improvementHint?: string,
      chainReferenceDataUrl?: string,
    ): Promise<string | undefined> => {
      if (!plan) return undefined;
      if (cover.status !== "done" || !cover.dataUrl) {
        void dialog.alert({
          title: "Generate the front cover first",
          message:
            "Interior pages reference the front cover for character consistency — characters, palette, and overall style are anchored to the cover. Generate the front cover first, then come back to render this page.",
          variant: "info",
        });
        return undefined;
      }
      updateItem(item.id, { status: "generating", error: undefined });

      const flawSuffix = improvementHint
        ? ` (PREVIOUS ATTEMPT WAS POOR — vision rater said: "${improvementHint}". The new image MUST fix this specific issue.)`
        : "";
      const seed = improvementHint
        ? `${item.id}#${Date.now().toString(36)}`
        : item.id;

      try {
        const [coverRefSmall, chainRefSmall, referenceSmall] = await Promise.all([
          downscaleReferenceImage(cover.dataUrl),
          downscaleReferenceImage(chainReferenceDataUrl),
          downscaleReferenceImage(reference ?? undefined),
        ]);

        if (mode === "story") {
          if (!plan.characters?.length || !plan.palette) {
            throw new Error(
              "Story brief is missing characters or palette — open the chat and re-finalize the brief.",
            );
          }
          const res = await fetch("/api/generate-story-page", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abortRef.current?.signal,
            body: JSON.stringify({
              ageBand: age,
              characters: plan.characters,
              palette: plan.palette,
              scene: item.subject + flawSuffix,
              dialogue: item.dialogue,
              narration: item.narration,
              composition: item.composition,
              coverReferenceDataUrl:
                coverRefSmall && coverRefSmall !== chainRefSmall
                  ? coverRefSmall
                  : undefined,
              chainReferenceDataUrl: chainRefSmall,
              model: interiorModel,
              coverStyle,
            }),
          });
          const json = await readJsonOrThrow<{
            dataUrl?: string;
            error?: string;
          }>(res);
          if (!json.dataUrl) {
            throw new Error(json.error || "Story page failed");
          }
          updateItem(item.id, {
            status: "done",
            dataUrl: json.dataUrl,
            quality: null,
            model: interiorModel,
          });
          return json.dataUrl;
        }
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current?.signal,
          body: JSON.stringify({
            mode: "subject",
            subject: item.subject + flawSuffix,
            age,
            detail: detailLevel,
            background: "scene",
            aspectRatio,
            scene: plan.scene,
            variantSeed: seed,
            referenceDataUrl: referenceSmall ?? undefined,
            chainReferenceDataUrl: chainRefSmall,
            coverReferenceDataUrl:
              coverRefSmall &&
                coverRefSmall !== chainRefSmall &&
                shareKeyNoun(plan.coverScene ?? "", item.subject)
                ? coverRefSmall
                : undefined,
            characterLock: characterLockBlock,
            qualityGate: qualityCheck,
            model: interiorModel,
          }),
        });
        const json = await readJsonOrThrow<{
          dataUrl?: string;
          error?: string;
          quality?: import("../types").QualityScore | null;
        }>(res);
        if (!json.dataUrl) {
          throw new Error(json.error || "Page failed");
        }

        updateItem(item.id, {
          status: "done",
          dataUrl: json.dataUrl,
          quality: json.quality ?? null,
          model: interiorModel,
        });
        return json.dataUrl;
      } catch (e) {
        if (isAbortError(e)) {
          updateItem(item.id, { status: "pending", error: undefined });
          return undefined;
        }
        const message = e instanceof Error ? e.message : "Failed";
        if (isCreditsError(message)) {
          updateItem(item.id, { status: "pending", error: undefined });
          void showCreditsExhaustedDialog(dialog, router);
          return undefined;
        }
        updateItem(item.id, { status: "error", error: message });
        return undefined;
      }
    },
    [
      plan,
      mode,
      age,
      aspectRatio,
      reference,
      qualityCheck,
      characterLockBlock,
      interiorModel,
      cover.status,
      cover.dataUrl,
      dialog,
      router,
      detailLevel,
      coverStyle,
      updateItem,
    ],
  );

  const regeneratePage = useCallback(
    async (item: PromptItem, improvementHint?: string) => {
      const anchorItem = items.find(
        (it) => it.id !== item.id && it.status === "done" && it.dataUrl,
      );
      const useChain =
        anchorItem &&
        (mode === "story" || shareKeyNoun(anchorItem.subject, item.subject));
      await generatePage(
        item,
        improvementHint,
        useChain ? anchorItem.dataUrl : undefined,
      );
    },
    [items, generatePage, mode],
  );

  const startGeneration = useCallback(async () => {
    if (runningRef.current || !plan) return;
    if (cover.status !== "done") return;
    runningRef.current = true;
    cancelRef.current = false;
    pausedRef.current = false;
    abortRef.current = new AbortController();
    setPhase("generating");

    try {
      if (mode !== "story" && characterLockStatus !== "done") {
        void extractCharacterLock().catch(() => { });
      }

      if (mode !== "story") {
        const pending = itemsRef.current.filter(
          (it) => it.status !== "done",
        );
        const CONCURRENCY = 4;
        let cursor = 0;
        const workers: Promise<void>[] = [];
        const runNext = async (): Promise<void> => {
          while (!cancelRef.current) {
            while (pausedRef.current && !cancelRef.current) {
              await new Promise((r) => setTimeout(r, 200));
            }
            if (cancelRef.current) return;
            const idx = cursor++;
            if (idx >= pending.length) return;
            const item = pending[idx];
            const globalIdx = itemsRef.current.findIndex(
              (it) => it.id === item.id,
            );
            if (globalIdx >= 0) setCurrentIndex(globalIdx);
            await generatePage(item, undefined, undefined);
          }
        };
        for (let i = 0; i < Math.min(CONCURRENCY, pending.length); i++) {
          workers.push(runNext());
        }
        await Promise.all(workers);
        setPhase(cancelRef.current ? "review" : "done");
        return;
      }

      const seedDone = items.find((it) => it.status === "done" && it.dataUrl);
      let anchor: { dataUrl: string; subject: string } | undefined = seedDone?.dataUrl
        ? { dataUrl: seedDone.dataUrl, subject: seedDone.subject }
        : cover.dataUrl
          ? {
            dataUrl: cover.dataUrl,
            subject: plan.coverScene ?? plan.title ?? "cover",
          }
          : undefined;
      const total = itemsRef.current.length;
      for (let i = 0; i < total; i++) {
        if (cancelRef.current) break;
        while (pausedRef.current && !cancelRef.current) {
          await new Promise((r) => setTimeout(r, 200));
        }
        if (cancelRef.current) break;
        setCurrentIndex(i);
        const item = itemsRef.current[i];
        if (!item) continue;
        if (item.status === "done") {
          if (
            item.dataUrl &&
            (!anchor ||
              (cover.dataUrl && anchor.dataUrl === cover.dataUrl))
          ) {
            anchor = { dataUrl: item.dataUrl, subject: item.subject };
          }
          continue;
        }
        const useChain =
          !!anchor &&
          (mode === "story" || shareKeyNoun(anchor.subject, item.subject));
        const dataUrl = await generatePage(
          item,
          undefined,
          useChain ? anchor!.dataUrl : undefined,
        );
        if (dataUrl) {
          const isFirstInteriorAnchor =
            !anchor || (cover.dataUrl && anchor.dataUrl === cover.dataUrl);
          if (isFirstInteriorAnchor) {
            anchor = { dataUrl, subject: item.subject };
          }
        }
      }

      setPhase(cancelRef.current ? "review" : "done");
    } finally {
      runningRef.current = false;
    }
  }, [
    plan,
    cover.status,
    cover.dataUrl,
    characterLockStatus,
    items,
    extractCharacterLock,
    generatePage,
    mode,
    setPhase,
    itemsRef,
    abortRef,
  ]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    setPhase("paused");
    abortRef.current?.abort();
    abortRef.current = new AbortController();
  }, [setPhase]);

  const resume = useCallback(() => {
    pausedRef.current = false;
    if (abortRef.current?.signal.aborted) {
      abortRef.current = new AbortController();
    }
    if (!runningRef.current) void startGeneration();
    else setPhase("generating");
  }, [startGeneration, setPhase]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    pausedRef.current = false;
    runningRef.current = false;
    abortRef.current?.abort();
    setPhase("review");
  }, [setPhase]);

  return {
    items,
    setItems,
    currentIndex,
    setCurrentIndex,
    updateItem,
    updatePromptText,
    removeItem,
    generatePage,
    regeneratePage,
    startGeneration,
    pause,
    resume,
    cancel,
    pausedRef,
    cancelRef,
    runningRef,
  };
}
