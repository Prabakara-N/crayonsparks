"use client";

import { useCallback, useState } from "react";
import type {
  ListingDraft,
  ListingPlatform,
  PlatformStatus,
} from "@/lib/kdp-metadata";
import { LISTING_PLATFORMS } from "../book-studio-constants";
import { initListingStatus } from "../book-studio-helpers";
import type { Plan, PromptItem, AgeRange } from "../types";

interface UseListingStateArgs {
  plan: Plan | null;
  mode: "qa" | "story";
  age: AgeRange;
  items: PromptItem[];
}

export function useListingState({
  plan,
  mode,
  age,
  items,
}: UseListingStateArgs) {
  const [listingDraft, setListingDraft] = useState<ListingDraft>({});
  const [listingStatus, setListingStatus] = useState<
    Record<ListingPlatform, PlatformStatus>
  >(() => initListingStatus());
  const [listingErrors, setListingErrors] = useState<
    Partial<Record<ListingPlatform, string>>
  >({});

  const generateMetadata = useCallback(
    async (only?: ListingPlatform) => {
      if (!plan) return;
      const isStory = mode === "story";
      const body = {
        bookTitle: plan.coverTitle ?? plan.title,
        scene: isStory ? plan.coverScene || plan.scene : plan.scene,
        age,
        pageCount: items.length,
        samplePages: items.slice(0, 8).map((it) => it.subject),
        kind: isStory ? "story" : "coloring",
      };
      const targets = only ? [only] : LISTING_PLATFORMS;
      setListingStatus((s) => {
        const next = { ...s };
        targets.forEach((p) => {
          next[p] = "loading";
        });
        return next;
      });
      setListingErrors((prev) => {
        const next = { ...prev };
        targets.forEach((p) => delete next[p]);
        return next;
      });
      await Promise.all(
        targets.map(async (platform) => {
          try {
            const res = await fetch(`/api/listing/${platform}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const json = (await res.json()) as {
              data?: unknown;
              error?: string;
            };
            if (!res.ok || !json.data)
              throw new Error(json.error ?? `${platform} failed`);
            setListingDraft((d) => ({ ...d, [platform]: json.data }));
            setListingStatus((s) => ({ ...s, [platform]: "done" }));
          } catch (e) {
            setListingStatus((s) => ({ ...s, [platform]: "error" }));
            setListingErrors((prev) => ({
              ...prev,
              [platform]: e instanceof Error ? e.message : `${platform} failed`,
            }));
          }
        }),
      );
    },
    [plan, mode, age, items],
  );

  return {
    listingDraft,
    listingStatus,
    listingErrors,
    generateMetadata,
  };
}
