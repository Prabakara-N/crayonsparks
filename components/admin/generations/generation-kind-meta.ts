import { BookOpen, Palette, PencilRuler, type LucideIcon } from "lucide-react";
import type { AdminGeneration } from "./generation-row";

export interface GenerationKindMeta {
  label: string;
  icon: LucideIcon;
  solid: string;
  soft: string;
}

export function generationKindMeta(
  kind: AdminGeneration["kind"],
): GenerationKindMeta {
  if (kind === "story") {
    return {
      label: "Story",
      icon: BookOpen,
      solid: "bg-violet-500/80 text-white",
      soft: "bg-violet-500/15 text-violet-200 border border-violet-500/30",
    };
  }
  if (kind === "activity") {
    return {
      label: "Activity",
      icon: PencilRuler,
      solid: "bg-amber-500/80 text-white",
      soft: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
    };
  }
  return {
    label: "Coloring",
    icon: Palette,
    solid: "bg-cyan-500/80 text-white",
    soft: "bg-cyan-500/15 text-cyan-200 border border-cyan-500/30",
  };
}
