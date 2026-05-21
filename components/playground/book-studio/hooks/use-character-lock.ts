"use client";

import { useCallback, useEffect, useState } from "react";
import { extractCharacterLock as runExtract } from "@/lib/functions/client/extract-character-lock";
import type { Plan } from "../types";

interface CharacterLockState {
  status: "pending" | "extracting" | "done" | "error";
  block?: string;
  error?: string;
}

interface UseCharacterLockArgs {
  plan: Plan | null;
  mode: "qa" | "story";
  coverStatus: "pending" | "generating" | "done" | "error";
  coverDataUrl?: string;
}

export function useCharacterLock({
  plan,
  mode,
  coverStatus,
  coverDataUrl,
}: UseCharacterLockArgs) {
  const [characterLock, setCharacterLock] = useState<CharacterLockState>({
    status: "pending",
  });

  const extractCharacterLock = useCallback(async () => {
    if (!plan || !coverDataUrl) return;
    setCharacterLock({ status: "extracting" });
    try {
      const result = await runExtract({
        coverDataUrl,
        bookTitle: plan.coverTitle ?? plan.title,
      });
      setCharacterLock({ status: "done", block: result.block });
    } catch (e) {
      setCharacterLock({
        status: "error",
        error: e instanceof Error ? e.message : "Character extraction failed",
      });
    }
  }, [plan, coverDataUrl]);

  useEffect(() => {
    if (mode === "story") return;
    if (coverStatus !== "done" || !coverDataUrl) return;
    if (characterLock.status !== "pending") return;
    void extractCharacterLock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverStatus, coverDataUrl, characterLock.status, mode]);

  return {
    characterLock,
    setCharacterLock,
    extractCharacterLock,
  };
}
