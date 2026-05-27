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

// Low-detail pages get a SHORTENED scene string. The full scene line is
// often rich ("magical forest with mushrooms, vines, fireflies, fallen
// logs and a glowing waterfall") which Gemini honors literally and packs
// the page with elements regardless of the LOW detail rule below. Keeping
// only the first clause hands the model a minimal cue that matches the
// LOW depth-layer rule.
function compressSceneForLowDetail(scene: string): string {
  const firstClause = scene.split(/[,.;:]| with | featuring | including | and /i)[0];
  return firstClause.trim().slice(0, 60);
}

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
    note: "Large subject filling most of the foreground. Flat 2D cartoon, kid-friendly proportions, friendly approachable expression. Eye style matches the subject — anatomically appropriate for the species or object, never enlarged 'kawaii' eyes unless the subject is explicitly a stylized character.",
  },
  kids: {
    label: "Kids (6-10)",
    note: "Centered subject with slightly more detail. Friendly cartoon style, proportional anatomy, eyes sized naturally for the species or object. Secondary elements allowed (ribbons, simple accessories).",
  },
  tweens: {
    label: "Tweens (10-14)",
    note: "More detailed illustration. Balanced composition, realistic proportions, naturalistic facial features. Some pattern and texture detail. Still approachable line art.",
  },
};

// User-facing "Detail level" knob — Low / Medium / High. Rewritten from
// count-based caps ("max 2 elements") to layout-based depth-layer
// language. Image diffusion plans composition up front; it can't iterate
// "count and remove extras" after the fact. Telling it WHICH depth
// layers to populate produces consistent density. Line weight scales
// with detail level so a Low page looks visibly chunkier than a High.
export const DETAIL_PRESETS: Record<Detail, string> = {
  simple:
    "DETAIL LEVEL — LOW. Composition: the subject stands alone on a single ground line (grass tuft, sand strip, floor seam — one short line). No mid-ground, no background scenery, no sky decoration, no scattered props. Just subject + ground. Line work: thick chunky outlines (about 4pt at print size), minimal interior detail, easy big regions for a small child to color inside. If the page brief mentions a richer setting, render only the subject and one single ground element — ignore the rest of the scenery for this level.",
  detailed:
    "DETAIL LEVEL — MEDIUM. Composition: TWO depth layers. Foreground = the subject occupying 50-60% of the page; mid-ground = ONE supporting prop or environmental element to the subject's side (a tree, a fence post, a tuft of flowers, a bench, a single cloud — pick what fits the subject's world). No third layer, no distant horizon detail, no scattered ground props, no decorative dots or sparkles, no repeated identical items. Line work: medium-weight outlines (about 3pt at print size), gentle interior pattern hints on the subject only, still clearly colorable.",
  intricate:
    "DETAIL LEVEL — HIGH. Composition: THREE depth layers. Foreground = the subject with one small prop or detail near its feet/hands; mid-ground = supporting scenery beside or behind the subject (one or two distinct objects — a tree, a building, a piece of furniture, terrain); far background = silhouettes or environmental features at the horizon (distant hills, distant buildings, distant tree-line, distant water-line, distant ceiling beams). Every element belongs to the subject's actual environment — never borrow generic outdoor scenery for an indoor / underwater / space / abstract subject. Line work: refined outlines (about 2.5pt at print size), detailed interior textures on each element appropriate to its material, still kid-colorable, no solid black fills. The subject remains the dominant focal element; richness is added around it, not on top of it.",
};

/**
 * Static guardrails block — pass via Gemini's `systemInstruction` so the
 * model implicitly caches the prefix across page calls (Gemini 2.5+
 * implicit caching kicks in at ~1024 stable tokens). Per-page dynamic
 * content (subject, scene, variation, character lock) goes in the user
 * prompt built by {@link MASTER_PROMPT_USER}.
 */
export const MASTER_PROMPT_SYSTEM = [
  "You generate borderless full-bleed single-page line-art illustrations for premium Amazon KDP children's coloring books. Every page is print-ready KDP quality.",
  NO_AI_BORDER_RULE,
  FILL_CANVAS_RULE,
  ANCHOR,
  COMMON_ELEMENT_STYLE,
  KID_SAFE_CONTENT_RULE,
  ANATOMY_GUARDRAIL,
  ANATOMY_COUNT_RULE,
  ANTHRO_FACE_GUARDRAIL,
  KDP_QUALITY_GUARDRAIL,
  STYLE_CONSISTENCY,
  ARTIFACT_GUARDRAIL,
  // Detail-level reference is in the system block so the model reads
  // the layout rules BEFORE the scene description. The user prompt
  // names which level applies to THIS page.
  `DETAIL LEVEL REFERENCE (the user prompt names which level applies to this page): LOW = ${DETAIL_PRESETS.simple} MEDIUM = ${DETAIL_PRESETS.detailed} HIGH = ${DETAIL_PRESETS.intricate}`,
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
  const rawScene = opts.scene?.trim() || null;
  const scene =
    rawScene && detail === "simple" ? compressSceneForLowDetail(rawScene) : rawScene;
  const agePreset = AGE_PRESETS[age];
  const variation = pickVariation(opts.variantSeed);
  const characterLock = opts.characterLock?.trim();
  const detailLabel =
    detail === "intricate" ? "HIGH" : detail === "detailed" ? "MEDIUM" : "LOW";
  const detailLayerHint =
    detail === "intricate"
      ? "three depth layers (foreground prop + mid-ground scenery + far-background silhouettes)"
      : detail === "detailed"
        ? "two depth layers (subject + one mid-ground prop)"
        : "subject alone on a single ground line, no scenery";

  const preamble =
    age === "tweens" ? "Tween coloring book page." : "Kids coloring book page.";

  const parts: string[] = [
    preamble,
    `DETAIL LEVEL FOR THIS PAGE: ${detailLabel} — render ${detailLayerHint}. Follow the matching LOW / MEDIUM / HIGH layout block in the system instructions exactly.`,
  ];
  if (characterLock) parts.push(characterLock);

  if (background === "scene") {
    parts.push(
      `Page subject / main focal group: ${subject}. ${variation.pose}, positioned ${variation.position}. Occupies 58-66% of the page height — large, dominant, instantly recognizable, and consistent with the other pages.`,
      PAGE_LAYOUT_CONSISTENCY,
      STROKE_CONSISTENCY,
      `Subject identity rule (load-bearing): draw exactly the subject named above and nothing else as a character. If the subject names an animal, an object, or a creature, that is what appears — do not substitute or add the cover's hero / mascot / human character unless the subject line literally names them. The character lock block (if present above) describes the visual style of recurring characters when they actually appear by name; it never adds them to a page that doesn't name them.`,
      scene
        ? `Background scene — pick from "${scene}", using ONLY elements that fit the subject's natural environment AND fit the page's detail level (the LOW/MEDIUM/HIGH layout block in the system). Distribute across the canvas. ${variation.bgEmphasis}. Background never overlaps the subject's face or main readable shape.`
        : `Background scene — derive elements from the subject's own natural habitat, capped by the page's detail level (the LOW/MEDIUM/HIGH layout block in the system). Distribute across the canvas. ${variation.bgEmphasis}. Background never overlaps the subject's face or main readable shape.`,
      `No-default-environment rule: do not insert trees, forest, hills, grass, sun, or clouds by default. Only include them if the theme line explicitly calls for them or the subject literally lives there. A superhero / city / vehicle / space / underwater / indoor / nighttime / abstract / mythology subject does not get trees in the background unless the brief said so.`,
      `No decorative-frame rule (this is a scene-mode page, NOT framed mode): do NOT draw a decorative floral wreath, leafy garland, vine arch, flower border, branch corners, or any ornamental motif framing the page edges. The page is BORDERLESS — the printer's rectangular border is added as a vector layer in post-processing, never by you. Foliage / flowers may appear as background scenery sized appropriately within the scene, never as a corner ornament or top-of-page decorative arch.`,
      `REFERENCE-IMAGE USAGE — read carefully: when a cover image and/or a prior interior page is attached as a visual reference, use it ONLY for two things — (a) the LOOK of the recurring characters (species, body proportions, color, fur texture, eye style, accessories), and (b) the LINE-ART STYLE (line weight, stroke polish). DO NOT copy the reference's scene composition, background elements, prop positions, character poses, character placement on the canvas, sky / cloud arrangement, tree positions, building positions, fence positions, or framing distance. Compose THIS page's scene FRESHLY from the page subject text above — never by editing the reference. If the new page would look like a near-duplicate of the reference with characters slightly repositioned, you are doing it wrong; redo it from scratch.`,
      `Per-page variety (each page MUST look visibly different from the others): rotate the sub-location every page so two pages of the book never share the same layout. THIS page picks a DIFFERENT sub-location, a DIFFERENT framing distance (close-up vs mid vs wide), and a DIFFERENT combination of supporting elements than the previous page. If the previous page was set near a doghouse, this page is somewhere else (porch, garden corner, by the fence, near the pond, on the path). If the previous page was a wide shot, this page is close-up — or vice versa. Pick supporting props from the subject's environment but rotate WHICH props appear and WHERE so two pages never share the same arrangement.`,
      `Thematic fit (strict): every background element must belong to the subject's actual environment. Test each element with one question: "would this naturally exist where this subject lives?" If the answer is no, omit it. Wrong-environment elements never appear on the page even if the cover or a previous page used them.`,
      "Composition restraint: follow the selected detail level's supporting-element count, but keep elements organized and readable. Fewer well-placed elements beats a busy page. No scattered sparkles, tiny hearts, dot textures, or sticker-like decorations unless the subject or theme specifically requires them.",
      "Ground line: a clear ground or surface (grass, sand, water, rooftop, floor — whatever fits the scene) extending across the page; the subject is never floating in white.",
    );
  } else if (background === "framed") {
    parts.push(
      "Decorative patterned border frame around the entire page (flowers, stars, vines, or geometric repeats fitting the subject) — this is part of the ART, not the printer's rectangle. The plain printer's border is added in post-processing; the decorative ornamental frame here is the page's illustrated border treatment. Same line-quality rules as the rest of the page.",
      "Per-page frame variety: the decorative pattern stays in the same family across the book, but each page rearranges or substitutes specific motifs so two pages never share an identical frame. The motif family is chosen to fit THIS book's subject (florals, geometric shapes, stars, abstract lines, era-appropriate ornaments — pick what suits the theme). If a chain-reference page is attached, copy only its line weight and overall density — never its exact motif placement.",
      `Subject: a single cute friendly ${subject} occupying at least 60% of the area inside the frame. ${variation.pose}, positioned ${variation.position}.`,
      PRINT_TRIM_SAFETY_RULE,
    );
  } else {
    parts.push(
      `Subject: a single cute friendly ${subject} filling 70-85% of the page, centered. ${variation.pose}.`,
      PRINT_TRIM_SAFETY_RULE,
      "Pure white background, no scene elements, just the subject.",
    );
  }

  parts.push(agePreset.note);
  parts.push(
    "FINAL CHECK BEFORE SUBMITTING — apply in order: " +
      "(1) ASYMMETRY — scene elements must be distributed asymmetrically; if foliage / trees / props form a mirrored wreath or archway around the subject, redistribute them off-axis. " +
      "(2) TEXT SCAN — any shape resembling a letter, digit, or word on signs / books / banners / blackboards / storefronts / posters / screens / props gets erased. The subject's name being 'Velociraptor', 'Tiger', 'Apple' is NOT permission to draw a letter — show the animal/object, never the letter. " +
      "(3) DEPTH LAYERS — confirm the selected detail level matches: Low = subject alone on a clean ground line, Medium = subject + one prop + one background silhouette, High = subject + foreground prop + mid-ground scenery + background silhouettes. " +
      "(4) COLOR SCAN — any color, gray shading, or fill anywhere on the canvas (red apple body, yellow lemon, green leaves, brown wood, blue sky tone, beige skin) gets converted to pure white interior with only the black outline remaining. The page is a coloring page — the child adds color, not you.",
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
