"use client";

import { useCallback, useEffect, useState } from "react";
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
      const res = await fetch("/api/extract-characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverDataUrl,
          bookTitle: plan.coverTitle ?? plan.title,
        }),
      });
      const json = (await res.json()) as {
        lockBlock?: string;
        error?: string;
      };
      if (!res.ok || !json.lockBlock) {
        throw new Error(json.error || "Character extraction failed");
      }
      setCharacterLock({ status: "done", block: json.lockBlock });
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
