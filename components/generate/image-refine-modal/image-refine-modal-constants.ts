import type { RefineContext } from "./types";

const FALLBACK_SUGGESTIONS_COVER = [
  "Make the title larger",
  "Use a brighter background",
  "Add a decorative border",
];
const FALLBACK_SUGGESTIONS_BACK_COVER = [
  "Make the tagline larger",
  "Make the top band darker",
  "Center the tagline vertically",
];
const FALLBACK_SUGGESTIONS_PAGE = [
  "Remove the sun from the scene",
  "Thicken the outlines",
  "Add a butterfly in the corner",
];
const FALLBACK_SUGGESTIONS_STORY_PAGE = [
  "Change the character's pose to match the action",
  "Make the background a different time of day",
  "Move the speech bubble closer to the speaker",
];

export function fallbackSuggestions(context: RefineContext): string[] {
  if (context === "back-cover" || context === "story-back-cover")
    return FALLBACK_SUGGESTIONS_BACK_COVER;
  if (context === "cover" || context === "story-cover")
    return FALLBACK_SUGGESTIONS_COVER;
  if (context === "story-page") return FALLBACK_SUGGESTIONS_STORY_PAGE;
  return FALLBACK_SUGGESTIONS_PAGE;
}
