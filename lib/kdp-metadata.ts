/**
 * Shared KDP metadata types.
 *
 * The Gemini-only generator that lived here previously was removed in
 * favor of the hybrid (Perplexity research + GPT-5-mini copy) generator
 * in `lib/kdp-metadata-hybrid.ts`. Hybrid produces noticeably better
 * KDP-aware titles + keywords because Perplexity grounds it in live
 * Amazon listings rather than the model's pre-trained world knowledge.
 *
 * This file now ONLY exports the shared types so existing imports across
 * the codebase (KdpMetadataPanel, kdp-package-pdf, BookStudio,
 * GeneratorStudio, etc.) continue to compile without churn.
 */

export type AgeBand = "toddlers" | "kids" | "tweens";

/**
 * Which Amazon KDP product family this listing is for. Drives the prompt
 * branch in the hybrid generator — coloring books and picture books have
 * different SEO landscapes (keywords, categories, copy, price bands) so
 * we can't share prompt prose.
 */
export type KdpKind = "coloring" | "story";

export interface KdpMetadataInput {
  bookTitle: string;
  scene: string;
  age: AgeBand;
  pageCount: number;
  samplePages: string[];
  kind?: KdpKind;
}

// Etsy listing — different rules than Amazon (140-char title, 13 tags
// each <=20 chars, plain-text description).
export interface EtsyMetadata {
  title: string;
  description: string;
  tags: string[];
}

// Instagram launch post — short caption + 5 focused hashtags.
export interface InstagramPost {
  caption: string;
  hashtags: string[];
}

export interface GumroadAdditionalInfoRow {
  label: string;
  value: string;
}

// Gumroad listing — emoji-rich description, one-line summary, key/value
// "additional information" rows (5-7), tags, and category.
export interface GumroadMetadata {
  name: string;
  summary: string;
  description: string;
  additionalInfo: GumroadAdditionalInfoRow[];
  tags: string[];
  category: string;
}

// Pinterest pin — title (<=100) + description (<=800).
export interface PinterestPin {
  title: string;
  description: string;
}

// Twitter / X launch post — single tweet with inline hashtags, no link
// (user appends their own).
export interface TwitterPost {
  caption: string;
}

// KDP-only fields — returned by the KDP per-platform generator.
export interface KdpCore {
  title: string;
  subtitle: string;
  descriptionHtml: string;
  descriptionText: string;
  keywords: string[];
  categories: string[];
  suggestedPriceUsd: string;
  notes?: string;
}

export interface KdpMetadata extends KdpCore {
  etsy?: EtsyMetadata;
  instagram?: InstagramPost;
  gumroad?: GumroadMetadata;
  pinterest?: PinterestPin;
  twitter?: TwitterPost;
}

// Working state used by the panel while platforms finish out-of-order.
export type ListingPlatform =
  | "kdp"
  | "etsy"
  | "gumroad"
  | "pinterest"
  | "instagram"
  | "twitter";

export type PlatformStatus = "pending" | "loading" | "done" | "error";

export interface ListingDraft {
  kdp?: KdpCore;
  etsy?: EtsyMetadata;
  gumroad?: GumroadMetadata;
  pinterest?: PinterestPin;
  instagram?: InstagramPost;
  twitter?: TwitterPost;
}

export function draftToKdpMetadata(draft: ListingDraft): KdpMetadata | null {
  if (!draft.kdp) return null;
  return {
    ...draft.kdp,
    etsy: draft.etsy,
    gumroad: draft.gumroad,
    pinterest: draft.pinterest,
    instagram: draft.instagram,
    twitter: draft.twitter,
  };
}
