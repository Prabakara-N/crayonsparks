export type AgeRange = "toddlers" | "kids" | "tweens";
export type Detail = "simple" | "detailed" | "intricate";
export type Background = "scene" | "framed" | "minimal";

export interface PromptOptions {
  age?: AgeRange;
  detail?: Detail;
  background?: Background;
  scene?: string;
  variantSeed?: string;
  characterLock?: string;
}

export type CoverStyle = "flat" | "illustrated";
export type CoverBorder = "framed" | "bleed";

export type BelongsToStyle = "bw" | "color";

export interface ColoringPrompt {
  id: string;
  name: string;
  subject: string;
}

export interface ColoringCategory {
  slug: string;
  number: number;
  name: string;
  icon: string;
  description: string;
  scene: string;
  coverScene: string;
  coverTitle: string;
  kdp: {
    title: string;
    description: string;
    keywords: string[];
    coverPrompt: string;
  };
  prompts: ColoringPrompt[];
}
