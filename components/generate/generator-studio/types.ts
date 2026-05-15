import type { ColoringPrompt, AgeRange, Detail, Background } from "@/lib/prompts";
import type { ImageModel } from "@/lib/constants";

export type AspectRatio = "1:1" | "3:4" | "4:3" | "2:3" | "3:2" | "9:16" | "16:9";
export type GenStatus = "idle" | "queued" | "generating" | "done" | "error";
export type CoverStyle = "flat" | "illustrated";
export type CoverBorder = "framed" | "bleed";

export interface GenItem {
  key: string;
  prompt: ColoringPrompt;
  status: GenStatus;
  dataUrl?: string;
  error?: string;
}

export interface GenOptions {
  age: AgeRange;
  detail: Detail;
  background: Background;
  aspectRatio: AspectRatio;
  categorySlug: string;
  scene?: string;
  referenceDataUrl?: string;
  model?: ImageModel;
}
