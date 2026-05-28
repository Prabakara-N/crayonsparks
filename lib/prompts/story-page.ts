import {
  ACTION_POSE_LIMB_CHECK,
  ANATOMY_GUARDRAIL,
  ANATOMY_COUNT_RULE,
  ANTHRO_FACE_GUARDRAIL,
  KID_SAFE_CONTENT_RULE,
  NO_REAL_BRAND_RULE,
  COMMON_ELEMENT_STYLE,
  SIGNATURE_ELEMENT_USAGE_RULE,
  RECURRING_ENVIRONMENT_LOCK_RULE,
  SCENE_LOCATION_LOCK_RULE,
  BACKGROUND_CROWD_CONTINUITY_RULE,
  OUTFIT_VIEW_ANGLE_RULE,
  AGE_BAND_PAGE_NOTE,
  AGE_BAND_LABEL_SINGULAR,
  AGE_BAND_RANGE,
  type AgeBand,
} from "./guardrails";
import { COVER_STYLE_DIRECTIVES } from "./cover";
import {
  STORY_RENDER_BEAT_HONESTY_RULE,
  STORY_RENDER_CHILD_SAFETY_RULE,
  STORY_RENDER_CAST_CONTINUITY_RULE,
  STORY_RENDER_INTERIOR_NO_ATTRIBUTION_RULE,
  STORY_RENDER_TEXT_ACCURACY_RULE,
} from "./story-quality";
import type { CoverStyle } from "./types";

export interface StoryCharacter {
  name: string;
  descriptor: string;
}

export interface StoryDialogueLine {
  speaker: string;
  text: string;
  speakerSide?: "left" | "right" | "center";
}

export interface StoryPalette {
  name: string;
  hexes: string[];
}

export interface StoryPageTemplateOptions {
  ageBand?: AgeBand;
  characters: StoryCharacter[];
  palette: StoryPalette;
  scene: string;
  dialogue?: StoryDialogueLine[];
  narration?: string;
  composition?: string;
  coverStyle?: CoverStyle;
  locationId?: string;
  locationDescriptor?: string;
  previousLocationId?: string;
  bubbleMode?: BubbleMode;
}

// Two interior style variants — must mirror the cover's coverStyle so the
// book reads as one coherent visual world. "flat" is the historical
// default; "illustrated" pulls the painterly directive shared with the
// coloring-book cover so interior pages match the picture-book Pixar look
// when the user picks Illustrated on the cover toggle.
const STORY_PAGE_STYLE_FLAT =
  "Style: flat 2D cartoon illustration, vibrant flat colors with bold black outlines, soft warm lighting feel, minimal shading (no realistic gradients, no painterly texture). Friendly rounded character forms with expressive faces sized naturally for the species (kawaii-style oversized eyes only when the locked descriptor explicitly calls for them), simple expressive mouths, gentle proportions. Modern picture-book aesthetic in the family of contemporary indie children's books.";
const STORY_PAGE_STYLE_ILLUSTRATED = `${COVER_STYLE_DIRECTIVES.illustrated} Same look as the cover — every interior page must feel like a sibling spread from the same picture book.`;
function pageStyleDirective(style?: CoverStyle): string {
  return style === "illustrated"
    ? STORY_PAGE_STYLE_ILLUSTRATED
    : STORY_PAGE_STYLE_FLAT;
}

const FULL_BLEED_RULE =
  "Composition: full-bleed illustration that fills the entire 6x9 portrait canvas to all four edges. NO border, NO frame, NO outer rectangle, NO white margin around the artwork. The background reaches every edge of the page. Aspect ratio 2:3 (portrait).";

const NO_TEXT_OUTSIDE_BUBBLES_RULE =
  "Text policy — STRICT. The ONLY text drawn anywhere on this interior page is the dialogue inside speech bubbles and the optional narration caption listed below. NO BOOK TITLE BLOCK, NO COVER TITLE typography, NO subtitle pill, NO page-count badge, NO side plaque, NO bottom strip, NO brand strapline — those belong on the FRONT COVER only and must NEVER appear on an interior page. If a cover reference image is attached, IGNORE every word of text rendered on it. No author name, no publisher, no URL, no page number, no watermark, no signature, no logo, no model attribution, no random letters or numbers in the background scenery. If a sign or book appears in the scene, leave it blank or use abstract squiggles, never readable letters.";

// Used when speech bubbles are added via SVG overlay in post-processing.
// The image model must render the scene ENTIRELY text-free; any drawn
// bubble would collide with the deterministic overlay layer.
const NO_TEXT_AT_ALL_RULE =
  "Text and bubble policy — STRICT, ZERO TEXT and ZERO BUBBLES ANYWHERE on this page. NO speech bubbles (filled or empty), NO thought bubbles, NO thought clouds, NO callout outlines, NO empty oval / rounded outlines hovering near characters' heads, NO dialogue text, NO narration caption, NO title, NO badge, NO plaque, NO strip, NO brand mark, NO author name, NO publisher, NO URL, NO page number, NO watermark, NO signature, NO logo, NO letters or numbers on signs / books / banners / blackboards / posters / screens / props. The page is a wordless scene illustration with NO bubble shapes of any kind. Speech bubbles and any narration captions are added in post-processing as a deterministic SVG overlay layer; any bubble outline OR text you draw — even an empty one — collides with that layer and produces a double-bubble defect. If you find yourself starting to draw a rounded or oval outline floating near a character's head, STOP and remove it before rendering. If a sign / book / chalkboard appears in the scene, leave the writing surface blank or use abstract squiggles, never readable letters. If a cover reference is attached, IGNORE every word of text on it.";

const SPEECH_BUBBLE_RULE =
  "Speech bubble rendering rules — CRITICAL: Each speech bubble is a clean white rounded oval / cloud with a thin dark outline and a clear pointed tail aimed at the speaking character's mouth. Inside the bubble, render the line of dialogue EXACTLY as written below — same words, same spelling, same punctuation, same casing — using a friendly readable rounded sans-serif at a size large enough to read at thumbnail. Center the text inside the bubble with comfortable padding on all sides. Bubbles are placed in empty sky / wall / background space, NEVER overlapping a character's face or another bubble. Maximum two bubbles on this page.";

const SPEECH_BUBBLE_OWNERSHIP_RULE =
  "Speech bubble ownership — STRICT, applies on EVERY page that has 2+ named characters and ANY dialogue (the rule is universal — humans + animals, animal + animal, kid + pet, two siblings, character + side-character, any combination). Each bubble belongs to ONE speaker and ONLY that speaker. Mandatory placement: (1) the bubble's body sits CLOSER to its own speaker than to any other character on the page (measure center-to-center distance). (2) the bubble's POINTED TAIL must originate from the bubble and visibly TOUCH or POINT directly into the speaker's mouth — never the other character's mouth, never a midpoint between them, never a piece of empty floor. (3) the bubble lives on the speaker's OWN SIDE of the page (left half if speaker is left, right half if speaker is right) — never on the opposite side. Forbidden patterns: (a) both bubbles clustered above the same character; (b) the tail of speaker A's bubble crossing OVER speaker B's body / head to reach back to A — if the tail would have to cross another character, MOVE THE BUBBLE so it sits on A's own side; (c) putting an animal-sound bubble (Woof, Meow, Tweet, Roar, Quack) anywhere near a non-animal character — animal sounds belong to the animal that produces them and the bubble must be anchored to THAT animal; (d) a small \"reaction\" bubble drawn near the wrong character because it was the closer empty space — if the named speaker is across the page, the bubble goes there even if it means a slightly tighter composition. Speaker-to-bubble visual test BEFORE drawing: cover the tail with a thumb — can a child still tell who's speaking from the bubble's POSITION ALONE? If no, reposition before rendering. After rendering, scan each bubble: is its tail's endpoint inside or right next to the named speaker's mouth? If not, the page must be redrawn.";

const RELATIVE_SCALE_RULE =
  "Relative-scale lock — STRICT, applies whenever 2+ named characters share the page: the height and body-mass ratio between characters MUST follow the locked descriptors above. If a descriptor calls one character small / tiny / a chick / a duckling and another large / chubby / a bear / an adult, the small one is visibly SHORTER and SMALLER on the page — typically the small character's head reaches only the larger character's chest or hip, not their shoulders or face. Adult-to-child ratio is roughly 1.6-2x. Small-creature-to-large-creature ratio (duckling to panda, mouse to lion) is roughly 3-5x. Maintain the SAME ratio on every page so the protagonists feel consistent across the book — a duckling that is hip-high to the panda on page 6 must still be hip-high to the panda on page 10, never face-high.";

const CHARACTER_FIDELITY_RULE =
  "Character fidelity (load-bearing): redraw each character so they match the locked descriptors above EXACTLY — same species, body proportions, head shape, color, accessories, and distinguishing features. Do not invent new clothing, new accessories, new species traits, or new colors. Each character appears at most ONCE per page; never duplicate the same character ANYWHERE in the frame — foreground, midground, far background, inside a window view, inside a mirror, on a poster, on a wall sticker, in a picture frame in the room. If the locked cast has ONE rabbit, the entire frame has ONE rabbit total, no second rabbit hopping past the window, no rabbit on a TV screen, no rabbit stuffed toy on a shelf. Only characters explicitly named in this page's scene description are drawn — no extra animals, no random side characters, no human onlookers unless the scene explicitly names them. Background scenery is just scenery: trees, hills, buildings, sky — no anonymous creatures populating it.";

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
  "Pose independence — STRICT, applies to every interior page. The pose, action, and on-canvas position of every character are determined by THIS PAGE'S OWN SCENE BRIEF below — NOT by the cover, NOT by any previously generated page. Read the scene description carefully; identify the verb and render the character DOING that verb. Do NOT default to the cover's stance just because the cover is attached as a character reference. Do NOT re-use the same pose across multiple pages — every page in the book must show a DIFFERENT pose driven by that page's specific moment in the story. Do NOT render characters in a generic 'group portrait' pose unless the brief explicitly calls for that. Camera framing distance MUST vary across the book: include close-ups (one character fills 50%+ of the frame), mid-shots, wide shots, and at least occasionally overhead, worm's-eye, or over-the-shoulder angles. Never render 3+ consecutive pages as the same group lineup at eye-level — if the prior page (chain reference) was a wide three-character lineup, this page is a close-up OR an overhead OR a side angle. Test before submitting: cover the brief with your hand and look at the rendered pose — could a child guess the verb from the body language alone? If the pose is generic 'standing and smiling', the answer is no — re-pose to match the actual action.";

const PROTAGONIST_PRESENCE_RULE =
  "Protagonist presence — STRICT. If the page brief mentions the protagonist by name OR by pronoun (she/he/they) OR depicts the protagonist receiving an action (being told something, being asked, being given, learning, deciding, hearing directions), the protagonist MUST be visible in the frame. The only exception is a page whose brief explicitly states the protagonist is off-screen (asleep in another room, watching from far away, etc.) AND whose narration / dialogue does not address them. Never render a 'directions to the protagonist' scene or an 'advice for the protagonist' scene with the protagonist missing. If a speech bubble's line is logically the protagonist's (questions about what to do, expressions of gratitude, decisions), the protagonist is the speaker and must appear next to the bubble.";

const FIRST_MENTION_NAMING_RULE =
  "First-mention naming — STRICT. When the narration or dialogue on this page introduces a new named character, draw that character prominently. Do not name a character in narration if the reader cannot tell which character on the page corresponds to the name. The bubble or caption with the name should clearly point to or describe the named character.";

// Two bubble modes:
//   - "model-drawn" — historical behavior; the image model draws bubbles
//     and writes the dialogue text. Reliable text + tail aim ~70% of the
//     time, fails the other ~30%.
//   - "svg-overlay"  — image model renders the scene WITHOUT bubbles;
//     the SVG compositor adds bubbles in post-processing for pixel-perfect
//     text + deterministic tail aim. Recommended default for production.
export type BubbleMode = "model-drawn" | "svg-overlay";

// Stable system rules for a specific age band + bubble mode — pass through
// Gemini's `systemInstruction` channel so the long prefix benefits from
// implicit context caching across every page in the same book run. The
// Per-book stable: same (band, bubbleMode, characters, palette) → same
// system string → Gemini implicit cache hit on every subsequent page in
// the run. Pass characters + palette so they live in the cached prefix
// instead of being re-billed on every page's user message.
export function buildStoryPageSystem(
  band: AgeBand = "toddlers",
  bubbleMode: BubbleMode = "svg-overlay",
  characters?: StoryCharacter[],
  palette?: StoryPalette,
): string {
  const range = AGE_BAND_RANGE[band];
  const label = AGE_BAND_LABEL_SINGULAR[band];
  const bubbleRules =
    bubbleMode === "svg-overlay"
      ? [NO_TEXT_AT_ALL_RULE]
      : [SPEECH_BUBBLE_RULE, SPEECH_BUBBLE_OWNERSHIP_RULE, NO_TEXT_OUTSIDE_BUBBLES_RULE];
  const lockParts: string[] = [];
  if (characters && characters.length > 0) {
    lockParts.push(formatCharacterLock(characters));
  }
  if (palette) {
    lockParts.push(formatPalette(palette));
  }
  return [
    `You generate single-page full-color illustrations for premium Amazon KDP children's picture books in the ${label} band (ages ${range}). Every page must be print-ready 300 DPI quality with consistent character design across the whole book.`,
    AGE_BAND_PAGE_NOTE[band],
    FULL_BLEED_RULE,
    CHARACTER_FIDELITY_RULE,
    PROTAGONIST_PRESENCE_RULE,
    FIRST_MENTION_NAMING_RULE,
    STORY_RENDER_CAST_CONTINUITY_RULE,
    STORY_RENDER_BEAT_HONESTY_RULE,
    POSE_INDEPENDENCE_RULE,
    ACCESSORY_LOCK_RULE,
    OUTFIT_VIEW_ANGLE_RULE,
    RELATIVE_SCALE_RULE,
    RECURRING_ENVIRONMENT_LOCK_RULE,
    SCENE_LOCATION_LOCK_RULE,
    BACKGROUND_CROWD_CONTINUITY_RULE,
    ...bubbleRules,
    STORY_RENDER_TEXT_ACCURACY_RULE,
    STORY_RENDER_INTERIOR_NO_ATTRIBUTION_RULE,
    STORY_RENDER_CHILD_SAFETY_RULE,
    NO_REAL_BRAND_RULE,
    KID_SAFE_CONTENT_RULE,
    COMMON_ELEMENT_STYLE,
    SIGNATURE_ELEMENT_USAGE_RULE,
    ANTHRO_FACE_GUARDRAIL,
    ANATOMY_GUARDRAIL,
    ANATOMY_COUNT_RULE,
    ACTION_POSE_LIMB_CHECK,
    NO_HAND_DRAWN_CLAIM_RULE,
    ...lockParts,
    "Output: a single coherent full-color full-bleed picture-book page.",
  ].join(" ");
}

function formatCharacterLock(characters: StoryCharacter[]): string {
  if (characters.length === 0) {
    return "Locked characters for this book: none — the page may have no named characters, only the scene described below.";
  }
  const lines = characters
    .map((c) => `${c.name.trim()}: ${c.descriptor.trim()}`)
    .join(" / ");
  const names = characters.map((c) => c.name.trim()).join(", ");
  const inventoryRows = characters
    .map(
      (c) =>
        `${c.name.trim()} = MAX 1 instance (count the visible bodies that match the descriptor; if more than one body matches, ERASE the extras before submitting)`,
    )
    .join("; ");
  const firstName = characters[0].name.trim();
  return [
    `Locked characters for this book (each character that appears on this page MUST match these descriptors EXACTLY): ${lines}.`,
    `CAST EXCLUSIVITY — the ONLY characters allowed on this page are from this list: ${names}. Render only the subset of these characters that this page's scene description names; never invent extras.`,
    `ZERO unnamed creatures, ZERO duplicate copies of the same locked character (one ${firstName} per page, not two — even in window views, mirrors, posters, picture frames, distant background, wall art, reflections, snow globes, photographs, paintings, magazine covers, stuffed toys, dolls, costumes, statues, signposts, or any prop with a creature on it), ZERO species swaps (do not turn an elephant into a different animal just because the page is set elsewhere).`,
    `PAGE CAST INVENTORY (mandatory count BEFORE submitting): ${inventoryRows}. ZERO instances of any creature whose name is not in the above list. Trace each silhouette in your finished rendering and tally: if the tally exceeds the MAX for any locked character, or if ANY unnamed creature appears, remove the extras before submitting.`,
    `Common duplicate-character bugs to actively guard against: (a) the cover reference shows the cast as a group portrait → on a new page you accidentally render a second instance of the protagonist further back in the scene; only ONE protagonist body exists. (b) the previous-page chain reference shows the same characters → you accidentally include a small "memory" or "echo" of them off to the side; only the bodies in THIS page's scene are rendered. (c) a window, mirror, frame, or picture inside the scene → that decorative surface MUST NOT depict a locked character at all; if a frame appears, leave it empty or fill with abstract pattern. (d) the protagonist and another character are facing each other → render exactly one of each, not two of the protagonist arguing with themselves.`,
  ].join(" ");
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

function formatDialogue(
  dialogue: StoryDialogueLine[] | undefined,
  bubbleMode: BubbleMode,
): string {
  if (!dialogue || dialogue.length === 0) {
    return "Dialogue on this page: none — render the scene without speech bubbles.";
  }
  if (bubbleMode === "svg-overlay") {
    // SVG overlay mode: dialogue feeds the prompt as COMPOSITION context
    // so the speaker is placed where the overlay's tail will point. The
    // text itself is NOT a draw-this-bubble instruction — the SVG
    // compositor handles bubbles after generation.
    const placements = dialogue.slice(0, 2).map((d) => {
      const speaker = d.speaker.trim();
      const side = d.speakerSide ?? "left";
      return side === "center"
        ? `${speaker} stands centered in the frame`
        : `${speaker} stands in the ${side} half of the frame, face clearly visible`;
    });
    return `Speaker placement on this page (speech bubbles are added in post-processing as SVG overlays — do NOT draw any bubbles or text yourself): ${placements.join("; ")}. Compose the page so each named speaker is clearly visible at the stated side, with empty sky / wall / background space above them where the overlay bubble will sit.`;
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

// Per-page dynamic content. Pair with buildStoryPageSystem(band) when
// calling Gemini so the static prefix is cached.
export function buildStoryPageUser(opts: StoryPageTemplateOptions): string {
  const band = opts.ageBand ?? "toddlers";
  const range = AGE_BAND_RANGE[band];
  const label = AGE_BAND_LABEL_SINGULAR[band];
  const parts: string[] = [
    `${label.charAt(0).toUpperCase() + label.slice(1)} picture-book page (ages ${range}).`,
    pageStyleDirective(opts.coverStyle),
  ];
  const locationLine = formatLocation(
    opts.locationId,
    opts.locationDescriptor,
    opts.previousLocationId,
  );
  if (locationLine) parts.push(locationLine);
  parts.push(`Scene description: ${opts.scene.trim()}`);
  if (opts.composition?.trim()) {
    parts.push(`Composition hint: ${opts.composition.trim()}.`);
  }
  parts.push(formatDialogue(opts.dialogue, opts.bubbleMode ?? "svg-overlay"));
  const narration = formatNarration(opts.narration);
  if (narration) parts.push(narration);
  return parts.join(" ");
}

// Continuity injection: when previous page shared the same locationId,
// prepend a SAME LOCATION directive so the renderer locks ground, fixtures,
// lighting, and palette to the prior frame. When the location changed,
// prepend a NEW LOCATION directive so the renderer doesn't accidentally
// reuse the prior frame's environment.
function formatLocation(
  id?: string,
  descriptor?: string,
  previousId?: string,
): string | null {
  if (!id?.trim() || !descriptor?.trim()) return null;
  const sameAsPrev = !!previousId && previousId.trim() === id.trim();
  if (sameAsPrev) {
    return `SAME LOCATION as the previous page — identical environment: ${descriptor.trim()}. Match ground material, fixtures, lighting, palette, and the position of recurring background elements to the chain reference image. Do NOT redesign or rearrange the environment between consecutive pages.`;
  }
  if (previousId?.trim()) {
    return `NEW LOCATION (the characters moved here from the previous page) — fresh environment: ${descriptor.trim()}. Do NOT reuse the previous page's ground, fixtures, or backdrop; this is a different physical place.`;
  }
  return `LOCATION: ${descriptor.trim()}. Match ground material, fixtures, lighting, and palette to this fixed description.`;
}
