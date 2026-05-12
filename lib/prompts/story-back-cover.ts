// Story-book back-cover prompt — picture-book back covers across all
// three age bands. Mirrors the coloring book's BACK_COVER_PROMPT_TEMPLATE
// pattern: INTENTIONALLY SIMPLE. The front cover is passed as a visual
// reference so the back automatically matches its dominant color family.

import {
  KID_SAFE_CONTENT_RULE,
  NO_REAL_BRAND_RULE,
  AGE_BAND_BACK_NOTE,
  AGE_BAND_LABEL_SINGULAR,
  AGE_BAND_RANGE,
  type AgeBand,
} from "./guardrails";
import { STORY_RENDER_TEXT_ACCURACY_RULE } from "./story-quality";
import type { StoryPalette } from "./story-page";

export interface StoryBackCoverTemplateOptions {
  ageBand?: AgeBand;
  title: string;
  palette: StoryPalette;
  tagline: string;
  forceColor?: string;
}

const COMPOSITION_RULE =
  "Composition: just two things — a soft textured colored background covering the canvas edge-to-edge, and one elegant tagline floating in the middle. No characters, no scene, no upper illustration zone, no barcode rectangle. Calm, spacious, lots of breathing room — Penguin-Classics back cover energy applied to a kids' picture book.";

const BACKGROUND_LAYER_RULE =
  "Background layering: apply the body color as TWO horizontal layers — a hairline header band at the very TOP only (2-3% of cover height, slightly darker / more saturated of the same hue), and the remaining 97-98% in a noticeably lighter pastel of the same hue. Clean straight horizontal edge between the two layers (no gradient). Subtle paper-texture speckle on both layers so it reads as a printed surface, not a flat digital fill. The lower 97-98% extends UNIFORMLY all the way to the bottom edge of the canvas — do NOT add a second darker band at the bottom, do NOT taper into a darker tint near the bottom edge, do NOT add a footer strip or lower border zone. The cover has ONE band only, at the top.";

const FULL_BLEED_RULE =
  "Full-bleed back-cover canvas, 6x9 portrait (aspect ratio 2:3). The colored background reaches all four edges. NO border, NO frame, NO white margin.";

const TAGLINE_PLACEMENT_RULE =
  "Tagline placement: centered horizontally and around 50% vertically. Set in elegant italic serif (Garamond, Caslon, or Playfair Display italic), dark warm grey to near-black, generous letter spacing, line-height ~1.4, broken across 2-3 centered lines at natural clause breaks.";

const FLOURISHES_RULE =
  "Optional flourishes (subtle, NOT mandatory — pick at most one of each): a tiny ornament (single flower, star, or 3-dot mark, 4-6% of cover width, same dark warm grey as the tagline) ~5% above the tagline; a short thin horizontal divider line ~3% below the tagline (15-20% of cover width). Both flourishes share the tagline's color so they read as one elegant text-block, not separate decorations.";

const TEXT_POLICY_RULE =
  "Text policy: the only printed text on this entire cover is the tagline, centered in the middle. No brand strapline, no CrayonSparks text, no author name, no publisher imprint, no ISBN block, no barcode, no rating, no website, no social handle, no email, no marketing blurb, no watermark, no URL, no page count, no age label, no random letters in the background.";

const NO_HAND_DRAWN_CLAIM_RULE =
  "Do not include any claim or watermark suggesting the art is hand-drawn, hand-painted, hand-illustrated, handmade, or original artwork.";

// Stable system rules for a band-specific story-book back cover.
export function buildStoryBackCoverSystem(band: AgeBand = "toddlers"): string {
  const range = AGE_BAND_RANGE[band];
  const label = AGE_BAND_LABEL_SINGULAR[band];
  return [
    `You generate back-cover illustrations for premium Amazon KDP children's picture books in the ${label} band (ages ${range}). Every back cover must be print-ready 300 DPI quality and match the front cover's color family. Keep the layout minimal — colored background plus one centered tagline only.`,
    AGE_BAND_BACK_NOTE[band],
    COMPOSITION_RULE,
    BACKGROUND_LAYER_RULE,
    FULL_BLEED_RULE,
    TAGLINE_PLACEMENT_RULE,
    STORY_RENDER_TEXT_ACCURACY_RULE,
    FLOURISHES_RULE,
    TEXT_POLICY_RULE,
    NO_REAL_BRAND_RULE,
    KID_SAFE_CONTENT_RULE,
    NO_HAND_DRAWN_CLAIM_RULE,
    "Output: a single coherent full-bleed picture-book back cover — soft textured colored background plus one centered tagline and no other text.",
  ].join(" ");
}

function formatPalette(palette: StoryPalette): string {
  const cleanHexes = palette.hexes
    .map((h) => h.trim())
    .filter((h) => /^#?[0-9a-fA-F]{6}$/.test(h.trim()))
    .map((h) => (h.startsWith("#") ? h.toUpperCase() : `#${h.toUpperCase()}`))
    .slice(0, 8);
  if (cleanHexes.length === 0) {
    return "Palette: warm friendly children's-book palette.";
  }
  return `Palette context — pick the back-cover body color from this set, weighted toward whichever hue dominates the attached front cover: ${cleanHexes.join(", ")}.`;
}

function formatColorSource(opts: StoryBackCoverTemplateOptions): string {
  if (opts.forceColor) {
    return `BODY COLOR — MANDATORY, OVERRIDES THE REFERENCE IMAGE: The user explicitly picked "${opts.forceColor}" for this back cover. The ENTIRE background MUST be a clear, recognizable "${opts.forceColor}" — verifiably that named hue, not a default cream and not a different color from the front cover. Even though a front-cover reference image is attached for context, IGNORE its color and apply "${opts.forceColor}" instead. A buyer should look at the back cover and immediately call it that color name.`;
  }
  return "Background color: a reference image of the front cover is attached. Identify its single largest-area background color and use that color family on the back (front pink to back pink, front mint to back mint, etc.). Apply it as a soft pastel of the front-cover hue — slightly lighter so the dark tagline reads cleanly against it.";
}

// Per-cover dynamic content. Pair with buildStoryBackCoverSystem(band).
export function buildStoryBackCoverUser(
  opts: StoryBackCoverTemplateOptions,
): string {
  const band = opts.ageBand ?? "toddlers";
  const range = AGE_BAND_RANGE[band];
  const label = AGE_BAND_LABEL_SINGULAR[band];
  const tagline = opts.tagline.trim().replace(/\s+/g, " ");
  const parts: string[] = [
    `${label.charAt(0).toUpperCase() + label.slice(1)} picture-book back cover (ages ${range}).`,
    `Book title (for context only — the title is NOT printed on the back cover): "${opts.title.trim()}".`,
    formatPalette(opts.palette),
    formatColorSource(opts),
    `Tagline (render this exact text — verbatim, centered in the middle of the cover): "${tagline}"`,
    "Do not render any other printed text besides the tagline.",
  ];
  return parts.join(" ");
}
