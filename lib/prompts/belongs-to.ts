import type { BelongsToStyle } from "./types";
import {
  ANATOMY_GUARDRAIL,
  ANATOMY_COUNT_RULE,
  ANTHRO_FACE_GUARDRAIL,
  NO_AI_BORDER_RULE,
} from "./guardrails";

/**
 * "This book belongs to" nameplate page generated automatically right after
 * the front cover. Composition: a decorative banner / nameplate centered on
 * the page with "This book belongs to:" in elegant lettering above a bold
 * blank writing line. Two of the book's main characters peek from the
 * left and right corners. Comes in two styles:
 *   - "bw"    → pure black-and-white line art so the kid can color it too
 *   - "color" → fully colored decorative page (parent fills the name in pen)
 */
export const BELONGS_TO_PROMPT_TEMPLATE = (opts: {
  bookTitle: string;
  characters: string;
  style: BelongsToStyle;
  characterLock?: string;
}): string => {
  const isColor = opts.style === "color";
  const styleHeader = isColor
    ? "Children's nameplate / bookplate page, full color. Vibrant flat 2D cartoon, thick clean outlines, warm friendly palette, flat color fills (no gradients, no shading)."
    : "Children's nameplate / bookplate page, pure black-and-white line art only — no color, no gray, no shading. Thick clean closed outlines a child can color.";

  const lock = opts.characterLock?.trim();
  const cameoCharacters = lock
    ? "The cameos must be the same characters that appear on the front cover (provided as a visual reference). Pick two from the character lock block above and reproduce them exactly — same species, body proportions, head shape, color, and distinguishing features. A different-colored or different-breed cameo is a failure."
    : `Pick two characters from this list: ${opts.characters}.`;

  return [
    NO_AI_BORDER_RULE,
    "Bookplate / 'This Book Belongs To' page. STRICT canvas: a TALL portrait 3:4 aspect ratio page (8.5 wide x 11 tall). Compose for a tall 3:4 frame — never square, never landscape. Fill the whole tall page top to bottom.",
    styleHeader,
    ...(lock ? [lock] : []),
    "Layout (fixed composition):",
    "1. Center: a decorative ornamental banner / scroll / nameplate frame (curved ribbon, oval cartouche, or rounded rectangle with corner flourishes). Occupies roughly the central 60% width × 40% height with thick clean outlined edges and one consistent flourish (curl, leaf, or dot) at each corner.",
    `2. Inside the banner — top line: the words "This Book Belongs To:" in playful but readable hand-lettered storybook font, ${isColor ? "dark warm grey or near-black" : "solid black ink"}, centered. Letters spelled exactly, generous letter-spacing.`,
    `3. Inside the banner — bottom area: a single bold horizontal blank line for the child's name (${isColor ? "solid dark warm grey" : "solid black"}), 60-70% of the banner's interior width, centered horizontally, ~60% down from the top of the banner. Don't pre-fill any name. Don't add text below the line.`,
    `4. Character cameos: one character in the lower-left area and one in the lower-right area, head and upper body only, both looking inward toward the banner with friendly happy expressions. ${cameoCharacters} Each cameo is 18-22% of the page height. CRITICAL — each character must be drawn FULLY INSIDE the page with a clear empty margin of at least 10% of the page width/height between the character and EVERY page edge. NEVER let any character touch, overlap, or run off the top, bottom, left, or right edge — no part of any character may be cropped by the page boundary. Pull the characters inward from the corners so they sit completely within the safe area. ${isColor ? "Same vibrant cartoon palette as the cover." : "Pure B&W line art, no fills."}`,
    "5. Background: mostly empty white. A few tiny scattered ornaments around the banner (small stars, dots, or simple flowers) are fine. No scenery — no sun, clouds, or landscape.",
    "6. Keep the bottom 8% of the page completely empty and clean — no text, no logo, no brand name, no signature of any kind.",
    "Don't include: any pre-filled name, any text other than 'This Book Belongs To:', page numbers, ANY rectangular page border / printer's frame / outline at the page edges, decorative perimeter frames, URLs, author signatures, the book title, speech bubbles, or patterns inside the banner. The page is BORDERLESS from the AI side — the printer's border is added later in post-processing.",
    ANATOMY_GUARDRAIL,
    ANATOMY_COUNT_RULE,
    ANTHRO_FACE_GUARDRAIL,
    `(Context only — don't render: the book is "${opts.bookTitle}".)`,
    "Output: a clean printable bookplate page ready to be page 2 of a KDP coloring book.",
  ].join(" ");
};
