/**
 * Story-book page prompts (Phase 1 — toddlers 3-6 picture book band).
 *
 * Distinct from the coloring-book master prompt: full color, full-bleed,
 * speech bubbles allowed, no decorative border, no B&W rules. Same
 * static-system / dynamic-user split so the long stable prefix benefits
 * from Gemini implicit context caching.
 *
 * Approach A (per docs/STORY_BOOK_PLAN.txt §2): Gemini renders text inside
 * speech bubbles. Quality gate verifies spelling; if regen rate is too high
 * we add Approach B (canvas compositing) later.
 */

import {
  ANATOMY_GUARDRAIL,
  ANATOMY_COUNT_RULE,
  KID_SAFE_CONTENT_RULE,
  NO_REAL_BRAND_RULE,
} from "./guardrails";
import { COVER_STYLE_DIRECTIVES } from "./cover";
import type { CoverStyle } from "./types";

export interface StoryCharacter {
  /** Short name as it appears in dialogue and scene text (e.g. "Pip"). */
  name: string;
  /**
   * Full visual descriptor — species, size, distinctive features, colors,
   * accessories. Restated verbatim on every page so the image model
   * doesn't drift between scenes.
   */
  descriptor: string;
}

export interface StoryDialogueLine {
  /** Must match a character name from the locked descriptor list above. */
  speaker: string;
  /** Spoken text. Hard cap 12 words for the toddler band. */
  text: string;
}

export interface StoryPalette {
  /** Human label (e.g. "Cheerful bright"). Used in chat UI, not the prompt. */
  name: string;
  /** Locked hex set. Each page is rendered using these colors only. */
  hexes: string[];
}

export interface StoryPageTemplateOptions {
  /** 1-3 locked characters that may appear on this page. */
  characters: StoryCharacter[];
  /** Locked palette for the whole book — same on every page. */
  palette: StoryPalette;
  /**
   * Description of the visible scene — composition, action, location,
   * mood. 12-30 words. Should NAME each character that actually appears
   * (the prompt enforces "only named characters are drawn").
   */
  scene: string;
  /**
   * Up to 2 speech bubbles for this page. Each speaker name must match
   * a character in `characters`. Hard cap 12 words per line.
   */
  dialogue?: StoryDialogueLine[];
  /**
   * Optional one-line narration rendered as a small caption at the top or
   * bottom of the page (not inside a bubble). Useful when the scene needs
   * a sentence of context that isn't dialogue. Hard cap 14 words.
   */
  narration?: string;
  /**
   * Optional camera / framing hint (e.g. "wide shot, both characters
   * visible left of center"). Read as a soft suggestion.
   */
  composition?: string;
  /**
   * Render style — must match the cover the user picked. "flat" (default)
   * keeps the historical flat-2D look; "illustrated" swaps in the
   * painterly Pixar/Disney-storybook directive so the interior pages
   * follow whatever the cover set as the visual language. Border /
   * full-bleed is hardcoded — interior story pages are always full bleed
   * regardless of the cover's framed/bleed choice.
   */
  coverStyle?: CoverStyle;
}

const TODDLER_BAND_NOTE =
  "Audience: toddlers 3-6. Friendly rounded characters with big expressive eyes, big simple shapes, calm safe scenes, no scary or stressful imagery.";

// Two interior style variants — must mirror the cover's coverStyle so the
// book reads as one coherent visual world. "flat" is the historical
// default; "illustrated" pulls the painterly directive shared with the
// coloring-book cover so interior pages match the picture-book Pixar look
// when the user picks Illustrated on the cover toggle.
const STORY_PAGE_STYLE_FLAT =
  "Style: flat 2D cartoon illustration, vibrant flat colors with bold black outlines, soft warm lighting feel, minimal shading (no realistic gradients, no painterly texture). Friendly rounded character forms with large expressive eyes, simple expressive mouths, gentle proportions. Modern picture-book aesthetic in the family of contemporary indie children's books.";
const STORY_PAGE_STYLE_ILLUSTRATED = `${COVER_STYLE_DIRECTIVES.illustrated} Same look as the cover — every interior page must feel like a sibling spread from the same picture book.`;
function pageStyleDirective(style?: CoverStyle): string {
  return style === "illustrated"
    ? STORY_PAGE_STYLE_ILLUSTRATED
    : STORY_PAGE_STYLE_FLAT;
}

const FULL_BLEED_RULE =
  "Composition: full-bleed illustration that fills the entire 6x9 portrait canvas to all four edges. NO border, NO frame, NO outer rectangle, NO white margin around the artwork. The background reaches every edge of the page. Aspect ratio 2:3 (portrait).";

const NO_TEXT_OUTSIDE_BUBBLES_RULE =
  "Text policy: the ONLY text drawn anywhere on this page is the dialogue inside speech bubbles and the optional narration caption listed below. No author name, no publisher, no URL, no page number, no watermark, no signature, no logo, no model attribution, no random letters or numbers in the background scenery. If a sign or book appears in the scene, leave it blank or use abstract squiggles, never readable letters.";

const SPEECH_BUBBLE_RULE =
  "Speech bubble rendering rules — CRITICAL: Each speech bubble is a clean white rounded oval / cloud with a thin dark outline and a clear pointed tail aimed at the speaking character's mouth. Inside the bubble, render the line of dialogue EXACTLY as written below — same words, same spelling, same punctuation, same casing — using a friendly readable rounded sans-serif at a size large enough to read at thumbnail. Center the text inside the bubble with comfortable padding on all sides. Bubbles are placed in empty sky / wall / background space, NEVER overlapping a character's face or another bubble. Maximum two bubbles on this page.";

const SPEECH_BUBBLE_OWNERSHIP_RULE =
  "🚨 Speech bubble ownership — STRICT, applies on EVERY page that has 2+ named characters and ANY dialogue (the rule is universal — humans + animals, animal + animal, kid + pet, two siblings, character + side-character, any combination). Each bubble belongs to ONE speaker and ONLY that speaker. Mandatory placement: (1) the bubble's body sits CLOSER to its own speaker than to any other character on the page (measure center-to-center distance). (2) the bubble's POINTED TAIL must originate from the bubble and visibly TOUCH or POINT directly into the speaker's mouth — never the other character's mouth, never a midpoint between them, never a piece of empty floor. (3) the bubble lives on the speaker's OWN SIDE of the page (left half if speaker is left, right half if speaker is right) — never on the opposite side. ❌ Forbidden patterns: (a) both bubbles clustered above the same character; (b) the tail of speaker A's bubble crossing OVER speaker B's body / head to reach back to A — if the tail would have to cross another character, MOVE THE BUBBLE so it sits on A's own side; (c) putting an animal-sound bubble (Woof, Meow, Tweet, Roar, Quack) anywhere near a non-animal character — animal sounds belong to the animal that produces them and the bubble must be anchored to THAT animal; (d) a small \"reaction\" bubble drawn near the wrong character because it was the closer empty space — if the named speaker is across the page, the bubble goes there even if it means a slightly tighter composition. Speaker-to-bubble visual test BEFORE drawing: cover the tail with a thumb — can a child still tell who's speaking from the bubble's POSITION ALONE? If no, reposition before rendering. After rendering, scan each bubble: is its tail's endpoint inside or right next to the named speaker's mouth? If not, the page must be redrawn.";

const RELATIVE_SCALE_RULE =
  "Relative-scale lock — STRICT, applies whenever 2+ named characters share the page: the height and body-mass ratio between characters MUST follow the locked descriptors above. If a descriptor calls one character small / tiny / a chick / a duckling and another large / chubby / a bear / an adult, the small one is visibly SHORTER and SMALLER on the page — typically the small character's head reaches only the larger character's chest or hip, not their shoulders or face. Adult-to-child ratio is roughly 1.6-2x. Small-creature-to-large-creature ratio (duckling to panda, mouse to lion) is roughly 3-5x. Maintain the SAME ratio on every page so the protagonists feel consistent across the book — a duckling that is hip-high to the panda on page 6 must still be hip-high to the panda on page 10, never face-high.";

const CHARACTER_FIDELITY_RULE =
  "Character fidelity (load-bearing): redraw each character so they match the locked descriptors above EXACTLY — same species, body proportions, head shape, color, accessories, and distinguishing features. Do not invent new clothing, new accessories, new species traits, or new colors. Each character appears at most ONCE per page; never duplicate the same character. Only characters explicitly named in the scene description are drawn — no extra animals, no random side characters, no human onlookers unless the scene names them.";

// The MOST COMMON anatomy bug in story-book pages is an extra ARM
// appearing when a character interacts with an object — stacking blocks,
// pointing at something, holding a toy while waving. The model sometimes
// renders one arm to support the action AND a second arm at rest AND
// then re-uses one of those arms with a different pose, ending up with
// three arms total. This rule explicitly catches that.
const ACTION_POSE_LIMB_CHECK =
  "🚨 Action-pose limb check — STRICT, applies whenever a character is interacting with an object OR a piece of fabric / cloth / blanket / sheet / curtain / scarf / clothing flap. Universal counts: a bipedal toddler-shaped character has EXACTLY 2 arms and 2 hands TOTAL — never 3 arms, never 4 hands, never an extra paw or hand poking out from behind the body, behind the head, beside the cheek, beside the chin, under a blanket, or anywhere else. Before drawing, mentally inventory the character's visible limbs: 'left arm = doing X, right arm = doing Y, NO third arm exists, NO third hand exists'. If the pose seems to need more than two hands (yawning + holding a blanket; reaching while waving; stacking + pointing; brushing teeth + waving; hugging + pointing), PICK ONE action that uses both hands TOGETHER, or split it: one hand on one element, one hand on another, the rest of the body relaxed — never invent a third hand. Common bugs to actively avoid: (a) a yawning character who has one hand at the mouth AND two hands holding the blanket = three hands; allowed pose is one hand at mouth + one hand on blanket OR both hands on blanket with mouth open and no hand near it. (b) a sleeping/lying character with arms shown above the blanket AND a third hand visible from under the blanket = three hands; allowed pose is two arms total whether above or below the blanket. (c) a character pointing at something while holding an object with two hands = three hands; allowed pose picks one. Body parts behind the character (a tail tip, a leg, a haunch, a fold of fabric, a pillow corner, an ear) MUST NOT be shaped or shaded so they look like an extra limb. A single object held in two hands shows the SAME object touched by both hands, not duplicated. After sketching the pose mentally, recount: 'arms = 2, hands = 2, fingers per hand = 5'. If any of those numbers are wrong, restart the pose.";

const ACCESSORY_LOCK_RULE =
  "Accessory lock — when a character's locked descriptor names an accessory (a watch, a bow, a hat, a backpack, a scarf, a medal), render EXACTLY ONE of that accessory in the EXACT placement the descriptor specifies. Never duplicate accessories (no two watches, no two scarves), never add a new accessory not in the descriptor, never omit a named accessory. If the descriptor says 'wears a red bow tie at the neck', the bow tie sits at the neck on every page. If the descriptor doesn't mention an accessory, do not invent one for that character.";

const NO_HAND_DRAWN_CLAIM_RULE =
  "Do not include any claim or watermark suggesting the art is hand-drawn, hand-painted, hand-illustrated, handmade, or original artwork. The art style is illustrated, not artisanal.";

// Pose independence — the recurring failure mode is that ~70% of interior
// pages reuse the cover's character pose (e.g. elephant + monkey standing
// together on the cover → most interior pages also show elephant + monkey
// standing together). The fix: a strict per-page rule that the pose comes
// FROM THE PAGE'S OWN SCENE BRIEF, never from the cover or prior pages.
const POSE_INDEPENDENCE_RULE =
  "🚨 Pose independence — STRICT, applies to every interior page. The pose, action, and on-canvas position of every character are determined by THIS PAGE'S OWN SCENE BRIEF below — NOT by the cover, NOT by any previously generated page. Read the scene description carefully; identify the verb (sleeping, hiding, climbing, hugging, walking, splashing, reaching, pointing, dancing, sitting, lying, peeking, etc.); render the character DOING that verb. ❌ Do NOT default to the cover's stance just because the cover is attached as a character reference. ❌ Do NOT re-use the same pose across multiple pages — every page in the book must show a DIFFERENT pose driven by that page's specific moment in the story. ❌ Do NOT render characters in a generic 'group portrait' pose (all standing facing forward) unless the brief explicitly calls for that. Camera angle and framing distance also vary per page — alternate close-up / mid-shot / wide-shot, alternate front / 3/4 / profile. Test before submitting: cover the brief with your hand and look at the rendered pose — could a child guess the verb from the body language alone? If the pose is generic 'standing and smiling', the answer is no — re-pose to match the actual action.";

/**
 * Stable system rules for the toddler band — sent via Gemini's
 * `systemInstruction` channel so the long prefix benefits from implicit
 * context caching across every page in the same book run.
 */
export const STORY_PAGE_TODDLER_SYSTEM = [
  "You generate single-page full-color illustrations for premium Amazon KDP children's picture books in the toddler band (ages 3-6). Every page must be print-ready 300 DPI quality with consistent character design across the whole book.",
  TODDLER_BAND_NOTE,
  // Style is injected per-call via the user message (see
  // STORY_PAGE_TODDLER_USER + pageStyleDirective) because the user picks
  // Flat vs Illustrated on the cover and every page must follow that
  // choice. Keeping it out of the static system keeps the prefix cacheable
  // across runs that pick different styles.
  FULL_BLEED_RULE,
  CHARACTER_FIDELITY_RULE,
  POSE_INDEPENDENCE_RULE,
  ACCESSORY_LOCK_RULE,
  RELATIVE_SCALE_RULE,
  SPEECH_BUBBLE_RULE,
  SPEECH_BUBBLE_OWNERSHIP_RULE,
  NO_TEXT_OUTSIDE_BUBBLES_RULE,
  NO_REAL_BRAND_RULE,
  KID_SAFE_CONTENT_RULE,
  ANATOMY_GUARDRAIL,
  ANATOMY_COUNT_RULE,
  ACTION_POSE_LIMB_CHECK,
  NO_HAND_DRAWN_CLAIM_RULE,
  "Output: a single coherent full-color full-bleed picture-book page.",
].join(" ");

function formatCharacterLock(characters: StoryCharacter[]): string {
  if (characters.length === 0) {
    return "Locked characters for this book: none — the page may have no named characters, only the scene described below.";
  }
  const lines = characters
    .map((c) => `${c.name.trim()}: ${c.descriptor.trim()}`)
    .join(" / ");
  return `Locked characters for this book (each character that appears on this page MUST match these descriptors EXACTLY): ${lines}.`;
}

function formatPalette(palette: StoryPalette): string {
  const cleanHexes = palette.hexes
    .map((h) => h.trim())
    .filter((h) => /^#?[0-9a-fA-F]{6}$/.test(h.trim()))
    .map((h) => (h.startsWith("#") ? h.toUpperCase() : `#${h.toUpperCase()}`))
    .slice(0, 8);
  if (cleanHexes.length === 0) {
    return "Palette: warm friendly children's-book palette — soft pastels and saturated accent colors that read clearly at thumbnail size.";
  }
  return `Palette lock — use only these colors and tonal blends of them across this page (no off-palette hues): ${cleanHexes.join(", ")}.`;
}

function formatDialogue(dialogue: StoryDialogueLine[] | undefined): string {
  if (!dialogue || dialogue.length === 0) {
    return "Dialogue on this page: none — render the scene without speech bubbles.";
  }
  const trimmed = dialogue.slice(0, 2).map((d, i) => {
    const speaker = d.speaker.trim();
    const text = d.text.trim().replace(/\s+/g, " ");
    return `Bubble ${i + 1} — owned by ${speaker} (place this bubble next to ${speaker}, tail aimed at ${speaker}'s mouth, NOT next to any other character), text: "${text}"`;
  });
  const speakers = Array.from(
    new Set(dialogue.slice(0, 2).map((d) => d.speaker.trim())),
  );
  const ownershipNote =
    speakers.length >= 2
      ? ` Each bubble must sit on ITS OWN speaker's side of the page — bubble 1 next to ${speakers[0]}, bubble 2 next to ${speakers[1]}. Do not stack both bubbles above one character.`
      : "";
  return `Dialogue on this page (${trimmed.length} bubble${trimmed.length === 1 ? "" : "s"} total — render each one as instructed in the speech-bubble rules above): ${trimmed.join("; ")}.${ownershipNote}`;
}

function formatNarration(narration: string | undefined): string {
  if (!narration?.trim()) return "";
  const text = narration.trim().replace(/\s+/g, " ");
  return `Optional narration caption — render at the very top OR very bottom of the page in a small, plain rectangular caption box (rounded corners, semi-opaque cream background, dark sans-serif text, no border): "${text}". Spell exactly as given. The caption never overlaps a character or a speech bubble.`;
}

/**
 * Per-page dynamic content. Pair with {@link STORY_PAGE_TODDLER_SYSTEM}
 * when calling Gemini so the static prefix is cached.
 */
export const STORY_PAGE_TODDLER_USER = (
  opts: StoryPageTemplateOptions,
): string => {
  const parts: string[] = [
    "Toddler picture-book page (ages 3-6).",
    pageStyleDirective(opts.coverStyle),
    formatCharacterLock(opts.characters),
    formatPalette(opts.palette),
    `Scene description: ${opts.scene.trim()}`,
  ];
  if (opts.composition?.trim()) {
    parts.push(`Composition hint: ${opts.composition.trim()}.`);
  }
  parts.push(formatDialogue(opts.dialogue));
  const narration = formatNarration(opts.narration);
  if (narration) parts.push(narration);
  return parts.join(" ");
};

/**
 * Backward-compatible single-string template. Concatenates the static
 * guardrails (system) and the dynamic per-page content (user). Prefer the
 * split form ({@link STORY_PAGE_TODDLER_SYSTEM} + {@link STORY_PAGE_TODDLER_USER})
 * when calling Gemini so the static prefix triggers implicit caching.
 */
export const STORY_PAGE_TODDLER_TEMPLATE = (
  opts: StoryPageTemplateOptions,
): string => {
  return `${STORY_PAGE_TODDLER_SYSTEM} ${STORY_PAGE_TODDLER_USER(opts)}`;
};
