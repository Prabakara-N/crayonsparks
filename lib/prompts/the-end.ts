import {
  ACTION_POSE_LIMB_CHECK,
  ANATOMY_GUARDRAIL,
  ANATOMY_COUNT_RULE,
  ANTHRO_FACE_GUARDRAIL,
  NO_AI_BORDER_RULE,
} from "./guardrails";
import {
  STORY_RENDER_TEXT_ACCURACY_RULE,
  STORY_RENDER_CHILD_SAFETY_RULE,
  STORY_RENDER_INTERIOR_NO_ATTRIBUTION_RULE,
} from "./story-quality";
import {
  COVER_STYLE_DIRECTIVES,
  COVER_BORDER_DIRECTIVES,
} from "./cover";
import type { CoverStyle, CoverBorder } from "./types";

interface TheEndPromptInput {
  bookTitle: string;
  message: string;
  paletteLine?: string;
  storyMood?: string;
  coverStyle?: CoverStyle;
  coverBorder?: CoverBorder;
}

export const THE_END_PROMPT_TEMPLATE = ({
  bookTitle,
  message,
  paletteLine,
  storyMood,
  coverStyle = "illustrated",
  coverBorder = "bleed",
}: TheEndPromptInput): string => {
  const styleDirective = COVER_STYLE_DIRECTIVES[coverStyle];
  const borderDirective = COVER_BORDER_DIRECTIVES[coverBorder];
  return [
    coverBorder === "bleed" ? NO_AI_BORDER_RULE : "",
    "FINAL 'The End' page for a children's full-color picture book. Portrait 2:3 aspect ratio, FULL-COLOR illustration. CRITICAL: This is a COLOR page — NOT black-and-white line art, NOT a coloring book page. Every element is painted in vibrant color with rich filled shapes. If the rendered output is monochrome / line-art / uncolored, the render is WRONG.",
    `Style — MUST match the rest of this book's cover and interior pages: ${styleDirective}`,
    `Border treatment — MUST match the book's cover border choice: ${borderDirective}`,
    paletteLine ? `Palette anchor: ${paletteLine}.` : "",
    storyMood
      ? `Story mood: ${storyMood}. The lettering, color choices, and decorative flourishes on this closing page should match this mood (cozy bedtime story → soft pastel sunset and rounded serif lettering; bold adventure → energetic warm palette and chunky display lettering; calm fable → muted woodland palette and elegant hand-lettering; magical fantasy → starry palette and whimsical lettering).`
      : "",
    "Layout (fixed composition):",
    "1. TOP — the words \"THE END\" rendered in a decorative custom storybook display lettering chosen to FIT this book's mood. Centered horizontally, occupying the top 22-28% of the page. Letters are perfectly spelled (just T-H-E space E-N-D, no extra punctuation), generously spaced, with subtle decorative flourishes that suit the story (rounded warm serif for bedtime, bold cartoon caps for adventure, hand-painted brush letters for fable, sparkly script for magical). Optional: sits on a soft ribbon / banner / arch / sky element if it suits the mood.",
    "2. MIDDLE — a warm, color-rich closing illustration that fits the book's world. This can be (pick whichever fits best): the main characters waving goodbye, OR a single symbolic farewell scene (a moon over the meadow, a glowing window seen from outside, a closed storybook on a cozy rug, a path leading into a sunset, a tucked-in bed under stars). Characters here are OPTIONAL — if used, draw them in a relaxed friendly farewell pose, but the page does NOT need to replicate the locked cast verbatim. A purely symbolic / scenic farewell is welcome.",
    `3. BOTTOM — render this EXACT closing line as a centered caption underneath the illustration, NOT inside a speech bubble. Render as plain decorative typography (the same lettering family as "THE END" but smaller and softer), centered horizontally, with one short ornamental flourish above or below it (tiny star, dot, leaf, or hyphen pair). Render every word letter-by-letter as written, no spelling changes, no auto-corrections, no truncating, no quotation marks: ${message}`,
    "4. BACKGROUND — a soft, full-color closing scene tied to the book's world (sunset sky, cozy bedroom at dusk, glowing campfire, starry meadow — pick what fits the mood). Calm, restful, warm-toned. Color fills cover the full canvas — NO white empty zones outside a centered card.",
    "5. Borderless — no rectangular page border, no decorative perimeter frame, no printer's outline, no URL, no author signature, no app name, no page number, no second title text.",
    "REINFORCEMENT: this is a fully painted picture-book color page. The whole canvas is filled with color from edge to edge. Closing typography is rendered as ART, not in a speech bubble. There are NO speech bubbles on this page.",
    "Distinct from the front cover — STRICT. This is the FINAL page of the book; it MUST visually differ from the front cover so the reader feels closure, not a loop. Do NOT replicate the cover's composition (do not place the locked cast in the same poses, same grouping, same eye-level lineup, same camera angle as the cover). Pick a DIFFERENT framing: a wider scenic farewell, a closer single-character close-up, a symbolic-only farewell scene with no characters, an overhead view, a silhouette at sunset, a backs-turned walking-away shot. Whatever the cover did (group portrait, eye-level lineup, characters facing forward), the END page does something else. If the cover reference is attached purely as a character / palette anchor, IGNORE its composition and start fresh from the layout above.",
    STORY_RENDER_TEXT_ACCURACY_RULE,
    STORY_RENDER_CHILD_SAFETY_RULE,
    STORY_RENDER_INTERIOR_NO_ATTRIBUTION_RULE,
    ANATOMY_GUARDRAIL,
    ANATOMY_COUNT_RULE,
    ACTION_POSE_LIMB_CHECK,
    ANTHRO_FACE_GUARDRAIL,
    `(Context only — don't render the book title text anywhere on the page; book is "${bookTitle}".)`,
    "Output: a clean printable 'The End' page ready to be the FINAL interior page of a KDP picture-book, before the back cover.",
  ]
    .filter(Boolean)
    .join(" ");
};
