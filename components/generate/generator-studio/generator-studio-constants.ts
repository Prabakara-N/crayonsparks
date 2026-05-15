import type { AgeRange, Detail, Background } from "@/lib/prompts";
import type { ListingPlatform, PlatformStatus } from "@/lib/kdp-metadata";
import type { AspectRatio } from "./types";

export const AGE_OPTIONS: { value: AgeRange; label: string; sub: string }[] = [
  { value: "toddlers", label: "Toddlers", sub: "3-6" },
  { value: "kids", label: "Kids", sub: "6-10" },
  { value: "tweens", label: "Tweens", sub: "10-14" },
];

export const DETAIL_OPTIONS: { value: Detail; label: string }[] = [
  { value: "simple", label: "Simple" },
  { value: "detailed", label: "Detailed" },
  { value: "intricate", label: "Intricate" },
];

export const BG_OPTIONS: { value: Background; label: string }[] = [
  { value: "scene", label: "Full Scene" },
  { value: "framed", label: "Decor Border" },
  { value: "minimal", label: "Minimal" },
];

export const LISTING_PLATFORMS: ListingPlatform[] = [
  "kdp",
  "etsy",
  "gumroad",
  "pinterest",
  "instagram",
  "twitter",
];

export const ASPECT_OPTIONS: { value: AspectRatio; label: string; sub: string }[] = [
  { value: "3:4", label: "KDP", sub: "3:4" },
  { value: "1:1", label: "Square", sub: "1:1" },
  { value: "2:3", label: "Tall", sub: "2:3" },
  { value: "4:3", label: "Landscape", sub: "4:3" },
  { value: "3:2", label: "Wide", sub: "3:2" },
  { value: "9:16", label: "Pin", sub: "9:16" },
  { value: "16:9", label: "Banner", sub: "16:9" },
];

export function initListingStatus(): Record<ListingPlatform, PlatformStatus> {
  return {
    kdp: "pending",
    etsy: "pending",
    gumroad: "pending",
    pinterest: "pending",
    instagram: "pending",
    twitter: "pending",
  };
}
