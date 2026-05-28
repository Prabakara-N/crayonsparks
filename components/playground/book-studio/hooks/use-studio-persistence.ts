"use client";

import { useEffect, useRef } from "react";
import {
  clearSession,
  readSession,
  writeSession,
} from "@/lib/book-storage";
import type {
  AgeRange,
  Aspect,
  CoverBorder,
  CoverStyle,
  DetailLevel,
  Phase,
  Plan,
  PromptItem,
} from "../types";

interface CoverSnapshot {
  status: "pending" | "generating" | "done" | "error";
  dataUrl?: string;
  error?: string;
}

interface StudioSnapshot {
  version: 1;
  bookKind: "coloring" | "story";
  idea: string;
  pageCount: number;
  age: AgeRange;
  aspectRatio: Aspect;
  detailLevel: DetailLevel;
  coverStyle: CoverStyle;
  coverBorder: CoverBorder;
  plan: Plan | null;
  items: PromptItem[];
  cover: CoverSnapshot;
  backCover: CoverSnapshot;
  belongsTo: CoverSnapshot;
  theEndPage: CoverSnapshot;
  phase: Phase;
}

interface UseStudioPersistenceArgs {
  storageKey: string;
  enabled?: boolean;
  values: StudioSnapshot;
  setters: {
    setBookKind: (v: "coloring" | "story") => void;
    setIdea: (v: string) => void;
    setPageCount: (v: number) => void;
    setAge: (v: AgeRange) => void;
    setAspectRatio: (v: Aspect) => void;
    setDetailLevel: (v: DetailLevel) => void;
    setCoverStyle: (v: CoverStyle) => void;
    setCoverBorder: (v: CoverBorder) => void;
    setPlan: (v: Plan | null) => void;
    setItems: (v: PromptItem[]) => void;
    setCover: (v: CoverSnapshot) => void;
    setBackCover: (v: CoverSnapshot) => void;
    setBelongsTo: (v: CoverSnapshot) => void;
    setTheEndPage: (v: CoverSnapshot) => void;
    setPhase: (v: Phase) => void;
  };
}

export interface UseStudioPersistenceResult {
  clearDraft: () => void;
}

const DEBOUNCE_MS = 600;

export function useStudioPersistence({
  storageKey,
  enabled = true,
  values,
  setters,
}: UseStudioPersistenceArgs): UseStudioPersistenceResult {
  const hydratedRef = useRef(false);
  const settersRef = useRef(setters);
  settersRef.current = setters;

  useEffect(() => {
    if (!enabled) return;
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const restored = readSession<StudioSnapshot>(storageKey);
    if (!restored || restored.version !== 1) return;
    const s = settersRef.current;
    s.setBookKind(restored.bookKind);
    s.setIdea(restored.idea ?? "");
    s.setPageCount(restored.pageCount ?? 6);
    s.setAge(restored.age);
    s.setAspectRatio(restored.aspectRatio);
    s.setDetailLevel(restored.detailLevel);
    s.setCoverStyle(restored.coverStyle);
    s.setCoverBorder(restored.coverBorder);
    s.setPlan(restored.plan);
    s.setItems(restored.items ?? []);
    s.setCover(restored.cover ?? { status: "pending" });
    s.setBackCover(restored.backCover ?? { status: "pending" });
    s.setBelongsTo(restored.belongsTo ?? { status: "pending" });
    s.setTheEndPage(restored.theEndPage ?? { status: "pending" });
    if (restored.phase) s.setPhase(restored.phase);
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!enabled) return;
    if (!hydratedRef.current) return;
    const id = setTimeout(() => {
      const snapshot: StudioSnapshot = { ...values, version: 1 };
      writeSession(storageKey, snapshot);
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [enabled, storageKey, values]);

  return {
    clearDraft: () => clearSession(storageKey),
  };
}
