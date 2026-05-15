import type { DialogueStyle } from "@/lib/prompts";
import type { ImageModel } from "@/lib/constants";
import { type StoryType } from "@/lib/story-book-planner";

export type Aspect = "1:1" | "3:4" | "4:3" | "2:3" | "3:2" | "9:16" | "16:9";
export type AgeRange = "toddlers" | "kids" | "tweens";

// Detail level — three values map to API's `simple | detailed | intricate`.
export type DetailLevel = "simple" | "detailed" | "intricate";

export type CoverStyle = "flat" | "illustrated";
export type CoverBorder = "framed" | "bleed";

export interface QualityScore {
  score: number;
  reason: string;
  pure_bw?: boolean;
  closed_outlines?: boolean;
  on_subject?: boolean;
  subject_size_ok?: boolean;
  anatomy_ok?: boolean;
  no_text?: boolean;
  no_ai_border?: boolean;
}

// Story-mode dialogue line carried per page.
export interface StoryDialogueLine {
  speaker: string;
  text: string;
}

export interface PromptItem {
  id: string;
  name: string;
  subject: string;
  status: "pending" | "queued" | "generating" | "done" | "error";
  dataUrl?: string;
  error?: string;
  quality?: QualityScore | null;
  model?: ImageModel;
  dialogue?: StoryDialogueLine[];
  narration?: string;
  composition?: string;
}

// Story-mode locked character — reused across every page in the book.
export interface StoryCharacter {
  name: string;
  descriptor: string;
}

// Story-mode locked palette — every page renders within this hue set.
export interface StoryPalette {
  name: string;
  hexes: string[];
}

export interface Plan {
  title: string;
  coverTitle: string;
  description: string;
  scene: string;
  coverScene: string;
  prompts: {
    name: string;
    subject: string;
    dialogue?: StoryDialogueLine[];
    narration?: string;
    composition?: string;
  }[];
  bottomStripPhrases?: string[];
  sidePlaqueLines?: string[];
  coverBadgeStyle?: string;
  notes?: string;
  characters?: StoryCharacter[];
  palette?: StoryPalette;
  detailLevel?: DetailLevel;
  storyType?: StoryType;
  dialogueStyle?: DialogueStyle;
  backCoverTagline?: string;
}

export type Phase =
  | "idea"
  | "planning"
  | "review"
  | "generating"
  | "paused"
  | "done";
