/**
 * Public barrel for prompt-builder modules. External callers import from
 * `@/lib/prompts` and get the same surface that the legacy single-file
 * `lib/prompts.ts` exposed before the split.
 *
 * Internal `./guardrails` constants are mostly scaffolding for the
 * template builders inside this directory and are NOT re-exported here.
 * The one exception is `NO_REAL_BRAND_RULE`, which is shared with prompt
 * builders that live outside this folder (`lib/book-chat.ts`,
 * `lib/book-planner.ts`).
 */

export type {
  AgeRange,
  Detail,
  Background,
  PromptOptions,
  CoverStyle,
  CoverBorder,
  BelongsToStyle,
  ColoringPrompt,
  ColoringCategory,
} from "./types";

export {
  AGE_PRESETS,
  DETAIL_PRESETS,
  MASTER_PROMPT_SYSTEM,
  MASTER_PROMPT_USER,
  MASTER_PROMPT_TEMPLATE,
} from "./master-page";

export {
  BACK_COVER_PROMPT_TEMPLATE,
  COLOR_COVER_PROMPT_TEMPLATE,
  THUMBNAIL_PROMPT_TEMPLATE,
} from "./cover";

export { BELONGS_TO_PROMPT_TEMPLATE } from "./belongs-to";

export { THE_END_PROMPT_TEMPLATE } from "./the-end";

export {
  REFERENCE_LED_PROMPT_TEMPLATE,
  STYLE_REFERENCE_PROMPT,
  BACK_COVER_COLOR_ANCHOR_PROMPT,
  BACK_COVER_COLOR_ANCHOR_FALLBACK_PROMPT,
  REFERENCE_ANALYSIS_FAILED_NOTE,
  RAW_REFERENCE_NOTE,
  CONSISTENCY_ANCHOR_PROMPT,
} from "./reference";

export { CATEGORIES, TOTAL_PROMPTS, findCategory } from "./categories";

export {
  NO_REAL_BRAND_RULE,
  NO_AI_BORDER_RULE,
  SIGNATURE_ELEMENT_USAGE_RULE,
  AGE_BAND_RANGE,
  AGE_BAND_LABEL_SINGULAR,
  AGE_BAND_AUDIENCE_PILL,
  AGE_BAND_PLAQUE_TAGLINE,
  DIALOGUE_MAX_WORDS,
  TAGLINE_MAX_WORDS,
  DIALOGUE_STYLE_LABEL,
  DIALOGUE_STYLE_DESCRIPTION,
  DIALOGUE_STYLE_TARGET,
  DEFAULT_DIALOGUE_STYLE,
} from "./guardrails";
export type { AgeBand, DialogueStyle } from "./guardrails";

export {
  STORY_PLANNER_QUALITY_RULES,
  STORY_RENDER_TEXT_ACCURACY_RULE,
  STORY_RENDER_CAST_CONTINUITY_RULE,
  STORY_RENDER_BEAT_HONESTY_RULE,
  STORY_RENDER_INTERIOR_NO_ATTRIBUTION_RULE,
  STORY_RENDER_CHILD_SAFETY_RULE,
} from "./story-quality";

export { buildStoryPageSystem, buildStoryPageUser } from "./story-page";
export type {
  StoryCharacter,
  StoryDialogueLine,
  StoryPalette,
  StoryPageTemplateOptions,
} from "./story-page";

export { buildStoryCoverSystem, buildStoryCoverUser } from "./story-cover";
export type { StoryCoverTemplateOptions } from "./story-cover";

export {
  buildStoryBackCoverSystem,
  buildStoryBackCoverUser,
} from "./story-back-cover";
export type { StoryBackCoverTemplateOptions } from "./story-back-cover";
