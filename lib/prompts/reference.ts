import type { AgeRange, Detail } from "./types";
import {
  AGE_PRESETS,
  PAGE_LAYOUT_CONSISTENCY,
  STROKE_CONSISTENCY,
} from "./master-page";
import {
  ANATOMY_GUARDRAIL,
  ANATOMY_COUNT_RULE,
  ANTHRO_FACE_GUARDRAIL,
  ARTIFACT_GUARDRAIL,
  KID_SAFE_CONTENT_RULE,
} from "./guardrails";

export const REFERENCE_LED_PROMPT_TEMPLATE = (
  subject: string,
  styleDescription: string,
  opts: { age?: AgeRange; detail?: Detail } = {},
): string => {
  const age = opts.age ?? "toddlers";
  const detail = opts.detail ?? "simple";
  const elementRange =
    detail === "intricate" ? "7-10" : detail === "detailed" ? "3-5" : "1-2";
  const agePreset = AGE_PRESETS[age];
  const preamble =
    age === "tweens"
      ? "Tween coloring book page."
      : "Kids coloring book page.";

  return [
    preamble,
    `Subject: ${subject}.`,
    `Reference is style inspiration only, not a scene template. A reference image is attached alongside this style description: "${styleDescription}". Use the reference for line weight, stroke style, character rendering, and pattern density only; not for the subject, scene, props, or composition.`,
    PAGE_LAYOUT_CONSISTENCY,
    STROKE_CONSISTENCY,
    `Background: generate fresh from ${subject}'s actual natural environment, not the reference's. Pick ${elementRange} supporting background elements that genuinely fit where ${subject} would be found. Scene reaches all four page edges with no empty white margin. Vary composition page-to-page so the book is not repetitive.`,
    `Thematic fit: every background element belongs to ${subject}'s environment. If the reference shows elements that do not fit, ignore them.`,
    `Subject placement: ${subject} fills 58-66% of the page height; the rest is filled with the subject-appropriate background.`,
    ANATOMY_GUARDRAIL,
    ANATOMY_COUNT_RULE,
    ANTHRO_FACE_GUARDRAIL,
    KID_SAFE_CONTENT_RULE,
    "Output is pure black-and-white line art. The reference may be colored; the output is not. Clean closed continuous strokes a child can color inside.",
    ARTIFACT_GUARDRAIL,
    "No borders or frames around the page. No page numbers. No author signatures or watermarks.",
    agePreset.note,
    `Output: a printable KDP coloring page that borrows the reference's line-art style but inhabits a fresh ${subject}-appropriate scene.`,
  ].join(" ");
};

export const STYLE_REFERENCE_PROMPT = (styleDescription: string): string =>
  `Apply the following art style to a brand-new illustration of the subject below: "${styleDescription}". The style description was extracted from a reference image the user uploaded. Adopt only the visual style: line weight, palette, character rendering polish, and pattern density. Do not copy specific scene elements, composition, or characters from the reference.`;

export const BACK_COVER_COLOR_ANCHOR_PROMPT = (
  styleDescription: string,
): string =>
  `A reference image of the front cover is attached. Use the same dominant background color family on the back cover. Style description from vision analysis: "${styleDescription}". Adopt that style, but the back cover stays minimal layout: soft colored background plus a single centered tagline, never a copy of the front. No barcode area. Use the front cover only for color matching, never for content.`;

export const BACK_COVER_COLOR_ANCHOR_FALLBACK_PROMPT =
  "A reference image of the front cover is attached. Match its dominant background color exactly on the back cover.";

export const REFERENCE_ANALYSIS_FAILED_NOTE =
  "(Note: a reference image was provided but could not be analyzed.)";

export const RAW_REFERENCE_NOTE =
  "Reference image is provided as visual inspiration. Use its style, but compose a fresh scene for this prompt.";

export const CONSISTENCY_ANCHOR_PROMPT = (refLabel: string): string =>
  [
    `REFERENCE-IMAGE USAGE RULE - STRICT - ${refLabel}.`,
    "The attached reference image(s) exist for one purpose: to lock the look of recurring characters across the book. Nothing else.",
    "Output is pure black-and-white line art. The reference image may be fully colored, especially when it is the cover. The output is not colored. Do not carry any color, gray shading, grayscale fill, soft tonal shading, watercolor wash, hatching for shadow, or tonal variance from the reference into the output. Do not fill fur, feathers, clothing, sky, ground, or props with any color or tone.",
    "Copy from the reference only: each recurring character's species, body proportions, head and face shape, fur, feather, or scale type, eye style, line-art marking pattern, distinguishing accessories, line weight, stroke polish, and detail density.",
    "Do not copy from the reference: background-element positions, building positions, prop positions, character poses, character placements, sky arrangement, cloud arrangement, sun arrangement, camera angle, framing distance, layout, or scene composition.",
    "Compose this page from scratch from this page's subject text. The new page should feel like a sibling illustration to the reference, not an edit of it.",
  ].join("\n\n");
