import type { AspectRatio } from "@/lib/gemini";
import type {
  AgeRange,
  Background,
  BelongsToStyle,
  CoverBorder,
  CoverStyle,
  Detail,
} from "@/lib/prompts";
import type { ImageModel } from "@/lib/constants";

export interface Body {
  mode?: "subject" | "raw" | "cover" | "back-cover" | "belongs-to";
  subject?: string;
  prompt?: string;
  age?: AgeRange;
  detail?: Detail;
  background?: Background;
  aspectRatio?: AspectRatio;
  categorySlug?: string;
  scene?: string;
  coverTitle?: string;
  coverScene?: string;
  coverStyle?: CoverStyle;
  coverBorder?: CoverBorder;
  pageCount?: number;
  ageLabel?: string;
  bottomStripPhrases?: string[];
  sidePlaqueLines?: string[];
  coverBadgeStyle?: string;
  brandStrapline?: string;
  backCoverDescription?: string;
  backCoverColor?: string;
  backCoverTagline?: string;
  belongsToCharacters?: string;
  belongsToStyle?: BelongsToStyle;
  characterLock?: string;
  variantSeed?: string;
  referenceDataUrl?: string;
  chainReferenceDataUrl?: string;
  coverReferenceDataUrl?: string;
  qualityGate?: boolean;
  model?: ImageModel;
}

export function parseDataUrl(
  url: string,
): { mimeType: string; data: string } | null {
  if (!url.startsWith("data:")) return null;
  const sep = url.indexOf(";base64,");
  if (sep < 0) return null;
  const mimeType = url.slice(5, sep);
  const data = url.slice(sep + 8);
  if (!mimeType || !data) return null;
  return { mimeType, data };
}
