import type { LucideIcon } from "lucide-react";

export type BookLoaderMode = "story" | "coloring";

export interface BookLoaderStep {
  id: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  gradient: string;
}

export interface BookGenerationLoaderProps {
  mode: BookLoaderMode;
  title?: string;
  subtitle?: string;
  estimatedSeconds?: number;
  currentStep?: number;
  totalKnownSteps?: number;
}
