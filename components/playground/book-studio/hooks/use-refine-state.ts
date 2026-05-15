"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { RefineContext } from "@/components/generate/image-refine-modal/image-refine-modal-main";
import type { ImageModel } from "@/lib/constants";
import type { QualityScore } from "../types";

interface RefineState {
  open: boolean;
  context: RefineContext;
  targetId: string;
  dataUrl?: string;
  title?: string;
  subtitle?: string;
  downloadName?: string;
  onRefined?: (dataUrl: string) => void;
  quality?: QualityScore | null;
  model?: ImageModel;
}

interface OpenRefineArgs {
  context: RefineContext;
  targetId: string;
  dataUrl?: string;
  title?: string;
  subtitle?: string;
  downloadName?: string;
  onRefined?: (dataUrl: string) => void;
  quality?: QualityScore | null;
  model?: ImageModel;
}

export function useRefineState() {
  const [refine, setRefine] = useState<RefineState>({
    open: false,
    context: "page",
    targetId: "",
  });

  const [refineStatus, setRefineStatus] = useState<
    Record<string, "running" | "done">
  >({});
  const [refineOpenNonce, setRefineOpenNonce] = useState(0);

  const openRefine = useCallback((next: OpenRefineArgs) => {
    setRefineOpenNonce((n) => n + 1);
    setRefine({ ...next, open: true });
  }, []);

  const closeRefine = useCallback(() => {
    setRefine((r) => ({ ...r, open: false }));
  }, []);

  const handleBackgroundChange = useCallback(
    (state: "running" | "done" | "idle", explicitTargetId?: string) => {
      const id = explicitTargetId ?? refine.targetId;
      if (!id) return;
      setRefineStatus((prev) => {
        if (state === "idle") {
          const { [id]: _omit, ...rest } = prev;
          return rest;
        }
        return { ...prev, [id]: state };
      });
      if (state === "done") {
        const snapshot = { ...refine, open: true };
        const targetLabel = refine.title?.trim() || "Page";
        toast.success(`Refine done · ${targetLabel}`, {
          description:
            "Background refine landed and was applied to the card.",
          action: {
            label: "Open",
            onClick: () => {
              setRefineOpenNonce((n) => n + 1);
              setRefine(snapshot);
            },
          },
          duration: 8000,
        });
        setTimeout(() => {
          setRefineStatus((prev) => {
            if (prev[id] !== "done") return prev;
            const { [id]: _omit, ...rest } = prev;
            return rest;
          });
        }, 4000);
      }
    },
    [refine],
  );

  return {
    refine,
    setRefine,
    refineStatus,
    setRefineStatus,
    refineOpenNonce,
    setRefineOpenNonce,
    openRefine,
    closeRefine,
    handleBackgroundChange,
  };
}
