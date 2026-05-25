import type { AgeRange, Detail, PromptOptions } from "./types";
import {
  ANATOMY_GUARDRAIL,
  ANATOMY_COUNT_RULE,
  ANCHOR,
  ANTHRO_FACE_GUARDRAIL,
  ARTIFACT_GUARDRAIL,
  COMMON_ELEMENT_STYLE,
  FILL_CANVAS_RULE,
  FINAL_BW_OVERRIDE,
  KDP_QUALITY_GUARDRAIL,
  KID_SAFE_CONTENT_RULE,
  NO_AI_BORDER_RULE,
  PRINT_TRIM_SAFETY_RULE,
  STYLE_CONSISTENCY,
} from "./guardrails";

const POSE_VARIANTS = [
  "facing the viewer directly with a happy smile",
  "slightly angled to the left, looking to the side",
  "slightly angled to the right, looking to the side",
  "in a gentle playful pose with a hint of motion",
  "standing or sitting naturally, relaxed and friendly",
  "tilted head, curious expression",
];

const POSITION_VARIANTS = [
  "centered on the page",
  "slightly left of center",
  "slightly right of center",
  "centered but lower on the page with more sky above",
  "centered but higher on the page with more ground below",
];

// Background variety variants — each page gets a different one (seeded by
// item.id) so a 20-page book has 20 visibly different backdrops within the
// same theme. KEY: every variant must produce a FILLED background that
// matches the theme — these are framing/feature swaps, NOT background
// suppression. Earlier versions said "no sky, no sun, no clouds" which
// fought the "fill the canvas" rule and made Gemini collapse to one safe
// default backdrop on every page.
const BACKGROUND_EMPHASIS_VARIANTS = [
  "wide-angle composition — distant horizon visible, lots of mid-ground depth, subject framed by far-off elements that fit the subject's environment",
  "close-up framing — subject large in foreground, immediate ground detail prominent, sky/upper area just a sliver at the top",
  "mid-distance composition — subject and surroundings balanced, supporting elements beside the subject AND distant scenery behind",
  "low-angle view — looking up slightly so the upper half is filled with sky/canopy/ceiling elements that match the theme, ground at the bottom",
  "side-profile landscape — horizontal strip composition, subject in motion across a long view (left to right), background stretches the full width",
  "vertical composition — emphasize a tall background element rising behind the subject, themed appropriately to the subject",
  "elevated viewpoint — looking down slightly, ground patterns more visible, subject sits on a textured surface",
  "open composition — subject centered with breathing room, supporting elements clustered to one side and distant elements opposite",
];

export const PAGE_LAYOUT_CONSISTENCY =
  "Book-wide layout consistency: keep the main focal group at the same visual scale across pages, occupying roughly 58-66% of page height and 62-74% of page width. Center it inside a consistent print-safe area with 7-10% breathing room from each edge. Background elements may reach all four edges, but the main focal group is never cropped, tiny, floating in the middle, or pushed against the top or bottom. The page should feel evenly composed from top to bottom with no large empty bands.";

export const STROKE_CONSISTENCY =
  "Book-wide stroke consistency: use the same clean rounded cartoon line weight on every page. Main contours are bold and even; interior detail lines are slightly lighter but never hairline-thin. If the subject explicitly includes a readable educational letter or number, draw it as one large rounded hollow block character with thick even outline matching the main contour weight, unfilled white interior, and no extra text.";

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function pickVariation(seed?: string) {
  if (!seed) {
    return {
      pose: POSE_VARIANTS[0],
      position: POSITION_VARIANTS[0],
      bgEmphasis: BACKGROUND_EMPHASIS_VARIANTS[3],
    };
  }
  const h = hash(seed);
  return {
    pose: POSE_VARIANTS[h % POSE_VARIANTS.length],
    position: POSITION_VARIANTS[Math.floor(h / 7) % POSITION_VARIANTS.length],
    bgEmphasis:
      BACKGROUND_EMPHASIS_VARIANTS[
        Math.floor(h / 49) % BACKGROUND_EMPHASIS_VARIANTS.length
      ],
  };
}

export const AGE_PRESETS: Record<AgeRange, { label: string; note: string }> = {
  toddlers: {
    label: "Toddlers (3-6)",
    note: "Large subject filling most of the foreground. Flat 2D cartoon, kid-friendly proportions, big round eyes, friendly happy expression.",
  },
  kids: {
    label: "Kids (6-10)",
    note: "Centered subject with slightly more detail. Friendly cartoon style, proportional anatomy, some secondary elements allowed (ribbons, simple accessories).",
  },
  tweens: {
    label: "Tweens (10-14)",
    note: "More detailed illustration. Balanced composition, realistic proportions, some pattern and texture detail. Still approachable line art.",
  },
};

// User-facing "Detail level" knob — Low / Medium / High. Each preset
// covers BOTH the line-art density (how detailed the strokes are) AND
// the scene density (how many supporting background elements appear).
// At every level the main character stays the visual focal point; the
// background never crowds, repeats, or upstages them.
export const DETAIL_PRESETS: Record<Detail, string> = {
  simple:
    "DETAIL LEVEL — LOW (STRICT HARD CAP). Line work: thick clean black outlines, minimal internal detail, easy to color inside. Scene density: the main character is the star and occupies AT LEAST 60% of the page area; render AT MOST 2 (TWO) small supporting background elements TOTAL — count them: foreground decorations, mid-ground props, far-background scenery, sky elements, and ground props ALL count toward this cap. Anything beyond 2 is a VIOLATION. Forbidden by default at this level (do NOT add unless one of them is your single chosen element): clouds, scattered rocks, scattered mushrooms, scattered flowers, scattered leaves, multiple trees (more than 1), grass-blade ground texture, decorative pathways, fences, signs, fallen logs, bushes, hills, stars, butterflies, birds. If the page subject names a setting like 'forest', 'garden', 'park', 'meadow', 'market', or 'woods', COMPRESS it to 1-2 symbolic representative elements (one tree, one cloud) — do NOT populate a full scene. Background is intentionally sparse; let the character breathe. NO repetitive props. NO crowded clusters of small items. Before submitting, count all supporting elements; if more than 2, REMOVE the extras.",
  detailed:
    "DETAIL LEVEL — MEDIUM. Line work: medium-weight clean black outlines, moderate internal detail (gentle texture, simple pattern hints), still clearly colorable. Scene density: a balanced scene around the character — 3-5 supporting background elements that genuinely belong to the subject's environment, well-spaced so each reads cleanly. The character clearly dominates the composition (occupies 50-60% of the page area). NO repetitive props (don't repeat the same item 3+ times). Each background element serves a purpose; remove anything that isn't earning its place.",
  intricate:
    "DETAIL LEVEL — HIGH. This is a rich, depth-filled page with visibly more scene content than Low or Medium. STRICT: render 7-10 distinct supporting background elements arranged in THREE depth layers: foreground props near the focal group, mid-ground scenery beside or behind the focal group, and far-background silhouettes or environmental features. EVERY element MUST come from THIS BOOK's specific subject world. Derive element choices from the page subject, the shared scene description, and the subject's natural environment; do not borrow generic scenery from unrelated coloring-book tropes. NEVER default to grass, clouds, distant hills, trees, or sunshine unless this book's actual subject and setting call for them. Each element is distinct: vary type, size, and position; never repeat the same element identically. Line work: clean black outlines with detailed interior textures appropriate to each element, still kid-colorable, no solid black fills. The main focal group keeps the same scale as the rest of the book and remains dominant; add richness around it instead of shrinking it. Forbidden: merging elements into a wall of texture, obscuring the focal subject's face or main readable shape, or using a generic outdoor backdrop regardless of the book's actual subject. The page should clearly look richer and more visually populated than Medium while preserving the same margins, focal scale, and stroke weight.",
};

/**
 * Static guardrails block — pass via Gemini's `systemInstruction` so the
 * model implicitly caches the prefix across page calls (Gemini 2.5+
 * implicit caching kicks in at ~1024 stable tokens). Per-page dynamic
 * content (subject, scene, variation, character lock) goes in the user
 * prompt built by {@link MASTER_PROMPT_USER}.
 */
export const MASTER_PROMPT_SYSTEM = [
  // NO_AI_BORDER_RULE sits at position 1 (right after the lead-in line)
  // because the model has very strong "coloring book = has border"
  // training priors and ignores the rule when it's buried mid-prompt.
  // The printer's border is added by lib/pdf.ts in post-processing —
  // any AI-drawn border produces a double border on the printed page.
  "You generate single-page illustrations for premium Amazon KDP children's coloring books. Every page must be print-ready KDP quality.",
  NO_AI_BORDER_RULE,
  ANCHOR,
  FILL_CANVAS_RULE,
  COMMON_ELEMENT_STYLE,
  KID_SAFE_CONTENT_RULE,
  ANATOMY_GUARDRAIL,
  ANATOMY_COUNT_RULE,
  ANTHRO_FACE_GUARDRAIL,
  KDP_QUALITY_GUARDRAIL,
  STYLE_CONSISTENCY,
  ARTIFACT_GUARDRAIL,
  "Output: a print-ready KDP coloring page. Every line purposeful, premium hand-illustrated cartoon look.",
].join(" ");

/**
 * Per-page dynamic content. Pair with {@link MASTER_PROMPT_SYSTEM} when
 * caching is desired. The standalone {@link MASTER_PROMPT_TEMPLATE} stitches
 * both together for callers that want a single string.
 */
export const MASTER_PROMPT_USER = (
  subject: string,
  opts: PromptOptions = {},
): string => {
  const age = opts.age ?? "toddlers";
  const detail = opts.detail ?? "simple";
  const background = opts.background ?? "scene";
  const scene = opts.scene?.trim() || null;
  const agePreset = AGE_PRESETS[age];
  const variation = pickVariation(opts.variantSeed);
  const characterLock = opts.characterLock?.trim();
  const elementRange =
    detail === "intricate" ? "7-10" : detail === "detailed" ? "3-5" : "1-2";

  const preamble =
    age === "tweens" ? "Tween coloring book page." : "Kids coloring book page.";

  const parts: string[] = [preamble];
  if (characterLock) parts.push(characterLock);

  if (background === "scene") {
    parts.push(
      `Page subject / main focal group: ${subject}. ${variation.pose}, positioned ${variation.position}. Occupies 58-66% of the page height — large, dominant, instantly recognizable, and consistent with the other pages.`,
      PAGE_LAYOUT_CONSISTENCY,
      STROKE_CONSISTENCY,
      `Subject identity rule (load-bearing): draw exactly the subject named above and nothing else as a character. If the subject names an animal, an object, or a creature, that is what appears — do not substitute or add the cover's hero / mascot / human character unless the subject line literally names them. The character lock block (if present above) describes the visual style of recurring characters when they actually appear by name; it never adds them to a page that doesn't name them.`,
      scene
        ? `Background scene (${elementRange} supporting elements, pick from "${scene}"): only use elements from that theme line that genuinely fit the subject's natural environment. Distribute across the canvas (upper area at the top, lower surface at the bottom, mid-ground beside the focal group). ${variation.bgEmphasis}. Background never overlaps the subject's face or main readable shape.`
        : `Background scene (${elementRange} supporting elements): derive them yourself from the subject's own natural habitat. Match the elements to where the subject would actually be found. Distribute across the canvas (upper area at the top, lower surface at the bottom, mid-ground beside the focal group). ${variation.bgEmphasis}. Background never overlaps the subject's face or main readable shape.`,
      `No-default-environment rule: do not insert trees, forest, hills, grass, sun, or clouds by default. Only include them if the theme line explicitly calls for them or the subject literally lives there. A superhero / city / vehicle / space / underwater / indoor / nighttime / abstract / mythology subject does not get trees in the background unless the brief said so.`,
      `No decorative-frame rule (this is a scene-mode page, NOT framed mode): do NOT draw a decorative floral wreath, leafy garland, vine arch, flower border, branch corners, or any ornamental motif framing the page edges. The page is BORDERLESS — the printer's rectangular border is added as a vector layer in post-processing, never by you. Foliage / flowers may appear as background scenery sized appropriately within the scene, never as a corner ornament or top-of-page decorative arch.`,
      `REFERENCE-IMAGE USAGE — read carefully: when a cover image and/or a prior interior page is attached as a visual reference, use it ONLY for two things — (a) the LOOK of the recurring characters (species, body proportions, color, fur texture, eye style, accessories), and (b) the LINE-ART STYLE (line weight, stroke polish). DO NOT copy the reference's scene composition, background elements, prop positions, character poses, character placement on the canvas, sky / cloud arrangement, tree positions, building positions, fence positions, or framing distance. Compose THIS page's scene FRESHLY from the page subject text above — never by editing the reference. If the new page would look like a near-duplicate of the reference with characters slightly repositioned, you are doing it wrong; redo it from scratch.`,
      `Per-page variety (each page MUST look visibly different from the others): rotate the sub-location every page so two pages of the book never share the same layout. THIS page picks a DIFFERENT sub-location, a DIFFERENT framing distance (close-up vs mid vs wide), and a DIFFERENT combination of supporting elements than the previous page. If the previous page was set near a doghouse, this page is somewhere else (porch, garden corner, by the fence, near the pond, on the path). If the previous page was a wide shot, this page is close-up — or vice versa. Pick supporting props from the subject's environment but rotate WHICH props appear and WHERE so two pages never share the same arrangement.`,
      `Thematic fit (strict): every background element must belong to the subject's actual environment. Test each element with one question: "would this naturally exist where this subject lives?" If the answer is no, omit it. Wrong-environment elements never appear on the page even if the cover or a previous page used them.`,
      "Composition restraint: follow the selected detail level's supporting-element count, but keep elements organized and readable. Fewer well-placed elements beats a busy page. No scattered sparkles, tiny hearts, dot textures, or sticker-like decorations unless the subject or theme specifically requires them.",
      "Ground line: a clear ground or surface (grass, sand, water, rooftop, floor — whatever fits the scene) extending across the page; the subject is never floating in white.",
      DETAIL_PRESETS[detail],
    );
  } else if (background === "framed") {
    parts.push(
      "Decorative patterned border frame around the entire page (flowers, stars, vines, or geometric repeats fitting the subject) — this is part of the ART, not the printer's rectangle. The plain printer's border is added in post-processing; the decorative ornamental frame here is the page's illustrated border treatment. Same line-quality rules as the rest of the page.",
      "Per-page frame variety: the decorative pattern stays in the same family across the book, but each page rearranges or substitutes specific motifs so two pages never share an identical frame. The motif family is chosen to fit THIS book's subject (florals, geometric shapes, stars, abstract lines, era-appropriate ornaments — pick what suits the theme). If a chain-reference page is attached, copy only its line weight and overall density — never its exact motif placement.",
      `Subject: a single cute friendly ${subject} occupying at least 60% of the area inside the frame. ${variation.pose}, positioned ${variation.position}.`,
      PRINT_TRIM_SAFETY_RULE,
      DETAIL_PRESETS[detail],
    );
  } else {
    parts.push(
      `Subject: a single cute friendly ${subject} filling 70-85% of the page, centered. ${variation.pose}.`,
      PRINT_TRIM_SAFETY_RULE,
      DETAIL_PRESETS[detail],
      "Pure white background, no scene elements, just the subject.",
    );
  }

  parts.push(agePreset.note);
  parts.push(
    "FINAL CHECK BEFORE SUBMITTING (re-read these and apply): (1) Scan the four page edges and corners — if ANY straight line forms a rectangle, outline, or printer's frame near the edges, ERASE IT. The page is borderless from your side. (2) Count the supporting background elements you drew. If the detail level is LOW, the count MUST be 2 or fewer total; remove the rest. If MEDIUM, 3-5. If HIGH, 7-10. If your count exceeds the cap, REMOVE the weakest elements until you are within range. (3) Scan the entire canvas — if you see ANY color, ANY gray shading, ANY fill (red apple body, yellow lemon, green leaves, brown wood, blue sky tone, beige skin), CONVERT IT TO PURE WHITE INTERIOR with only the BLACK OUTLINE remaining. The page is a coloring page — the CHILD adds color, not you. All three checks happen BEFORE you finalize the image.",
  );
  parts.push(FINAL_BW_OVERRIDE);
  return parts.join(" ");
};

/**
 * Backward-compatible single-string template. Concatenates the static
 * guardrails (system) and the dynamic per-page content (user). Prefer the
 * split form ({@link MASTER_PROMPT_SYSTEM} + {@link MASTER_PROMPT_USER})
 * when calling Gemini, so the static prefix triggers implicit caching.
 */
export const MASTER_PROMPT_TEMPLATE = (
  subject: string,
  opts: PromptOptions = {},
) => {
  return `${MASTER_PROMPT_SYSTEM} ${MASTER_PROMPT_USER(subject, opts)}`;
};
