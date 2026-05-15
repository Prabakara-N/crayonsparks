import type { ListingPlatform } from "@/lib/kdp-metadata";
import type { Aspect, AgeRange, DetailLevel } from "./types";

export const DETAIL_LABELS: Record<DetailLevel, string> = {
  simple: "Low",
  detailed: "Medium",
  intricate: "High",
};

export const DETAIL_DESCRIPTIONS: Record<DetailLevel, string> = {
  simple:
    "Character is the star · 1-2 background props · sparse on purpose",
  detailed:
    "Character + 3-5 supporting elements · balanced · plenty of breathing room",
  intricate:
    "Richer scene · 6-10 distinct supporting elements · never cluttered or repetitive",
};

export const ASPECTS: Aspect[] = ["3:4", "1:1", "2:3", "4:3", "3:2"];

export const AGE_LABELS: Record<AgeRange, string> = {
  toddlers: "Toddlers 3-6",
  kids: "Kids 6-10",
  tweens: "Tweens 10-14",
};

export const LISTING_PLATFORMS: ListingPlatform[] = [
  "kdp",
  "etsy",
  "gumroad",
  "pinterest",
  "instagram",
  "twitter",
];

// Stopwords stripped before noun-overlap matching. Anything 4+ chars that
// isn't here counts as a candidate "key noun" for the chain decision.
export const NOUN_OVERLAP_STOPWORDS = new Set([
  "with", "from", "into", "that", "this", "have", "been", "they", "them",
  "their", "there", "where", "what", "when", "which", "while", "some",
  "page", "scene", "show", "shows", "showing", "draw", "drawn", "drawing",
  "coloring", "color", "colour", "book", "kids", "child", "children",
  "simple", "detailed", "outline", "outlines", "background", "white",
  "black", "happy", "smiling", "cute", "playing", "sitting", "standing",
  "animal", "animals", "creature", "creatures", "wild", "tame", "friendly",
  "jungle", "forest", "woodland", "savanna", "desert", "ocean", "sea",
  "underwater", "river", "lake", "mountain", "mountains", "garden",
  "farm", "barnyard", "meadow", "field", "yard", "park", "playground",
  "indoors", "outdoors", "inside", "outside", "around", "together",
  "morning", "evening", "afternoon", "night", "daytime", "sunny",
  "bright", "soft", "warm", "cold", "little", "small", "large",
  "magic", "magical", "world", "place", "scenery", "landscape",
]);

export const STORY_PLAN_STAGES = [
  "Sketching the world…",
  "Naming locked characters…",
  "Picking the colour palette…",
  "Writing scene-by-scene plot…",
  "Drafting dialogue + narration…",
  "Polishing the brief…",
] as const;

export const COLORING_PLAN_STAGES = [
  "Brainstorming the theme…",
  "Locking the cover scene…",
  "Drafting the title…",
  "Generating page prompts…",
  "Building the side plaque + bottom strip…",
  "Polishing the brief…",
] as const;
