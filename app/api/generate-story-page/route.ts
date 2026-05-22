// Story-book page generation endpoint. Distinct from /api/generate which
// serves the coloring-book product. Output is a single 6x9 portrait
// illustration as a PNG data URL.

import { NextResponse } from "next/server";
import { generateImageByModel } from "@/lib/image-providers";
import { preauthorizeCharge } from "@/lib/credits/charge";
import {
  DEFAULT_COVER_MODEL,
  isImageModel,
  type ImageModel,
} from "@/lib/constants";
import {
  buildStoryPageSystem,
  buildStoryPageUser,
  DIALOGUE_MAX_WORDS,
  type AgeBand,
  type StoryCharacter,
  type StoryDialogueLine,
  type StoryPalette,
} from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  characters?: StoryCharacter[];
  palette?: StoryPalette;
  scene?: string;
  dialogue?: StoryDialogueLine[];
  narration?: string;
  composition?: string;
  ageBand?: AgeBand;
  model?: ImageModel;
  coverStyle?: "flat" | "illustrated";
  coverReferenceDataUrl?: string;
  chainReferenceDataUrl?: string;
}

const VALID_AGE_BANDS: readonly AgeBand[] = ["toddlers", "kids", "tweens"];

function normalizeAgeBand(value: unknown): AgeBand {
  return typeof value === "string" && (VALID_AGE_BANDS as readonly string[]).includes(value)
    ? (value as AgeBand)
    : "toddlers";
}

// Strip duplicate / near-duplicate bubbles so the image model isn't asked
// to render the same line twice — root cause of the Goldilocks "Oh! I am
// surprised." duplicate-bubble bug.
function dedupeDialogue(dialogue: StoryDialogueLine[]): StoryDialogueLine[] {
  const seen = new Set<string>();
  const out: StoryDialogueLine[] = [];
  for (const line of dialogue) {
    const text = line.text?.trim().replace(/\s+/g, " ");
    if (!text) continue;
    const key = text.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      speaker: line.speaker?.trim() ?? "",
      text: ensureTerminalPunctuation(text),
    });
  }
  return out;
}

// Auto-append a period to any string that doesn't already end with a
// terminal punctuation mark — fixes the Pippa book bug where the planner
// emitted narration like "They made a new map together" with no period.
function ensureTerminalPunctuation(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return /[.!?…]['")\]]?$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function parseDataUrl(
  url: string,
): { mimeType: string; data: string } | null {
  if (!url.startsWith("data:")) return null;
  const sep = url.indexOf(";base64,");
  if (sep < 0) return null;
  const mimeType = url.slice(5, sep);
  const data = url.slice(sep + 8);
  if (!mimeType || !data) return null;
  return { mimeType, data };
}

function buildConsistencyAnchorPreamble(
  hasCover: boolean,
  hasChain: boolean,
): string {
  if (!hasCover && !hasChain) return "";
  const refLabel =
    hasCover && hasChain
      ? "TWO images from THE SAME BOOK are attached as visual references — image 1 is the FRONT COVER, image 2 is the previously generated INTERIOR PAGE"
      : hasCover
        ? "An image from THE SAME BOOK is attached as a visual reference — the FRONT COVER"
        : "An image from THE SAME BOOK is attached as a visual reference — a previously generated INTERIOR PAGE";
  return `REFERENCE IMAGE USAGE — STRICT — ${refLabel}. The references serve ONE purpose: to lock the LOOK of the recurring characters across the book. NOTHING ELSE.\n\nCOPY from the references (these and ONLY these):\n• Each character's species, body proportions, head/face shape, fur / feather / skin color, eye style, markings, distinguishing accessories, AND locked outfit / garment (a red bow at the neck stays a red bow at the neck; a red backpack on the back stays a red backpack — never swap one for the other across pages).\n• Overall illustrative style: line weight, color saturation, lighting feel, rendering polish.\n• Speech-bubble shape and lettering style (when bubbles already appeared on a prior page).\n\nDO NOT COPY from the references (this list is load-bearing — copying any of these is the most common quality killer):\n• TITLE TEXT / COVER OVERLAYS — the book title, subtitle pill, page-count badge, side plaque, bottom strip phrases, brand strapline, and any other rendered text on the cover MUST NOT appear on this interior page. Interior pages contain ONLY the narration caption and/or speech bubbles supplied in the brief below — never the book title, never a marketing badge, never a side plaque, never the brand strapline. If you see text on the cover reference, IGNORE that text entirely.\n• Character POSES — the new page must show a DIFFERENT pose driven by THIS PAGE'S scene description below. Pick the pose from this page's brief, NOT from what they were doing on the cover.\n• Character POSITIONS / framing on the canvas — this page composes fresh.\n• CAMERA angle and framing distance — vary close-up / mid-shot / wide-shot across pages instead of cloning the cover's angle. Across any 3 consecutive pages, framing distance MUST vary — include at least one close-up (one character occupies 50%+ of the frame), one mid-shot, and one wide. Never render 3+ consecutive pages as the same group lineup at eye-level.\n• SCENE / setting / location — the cover is one scene; this page's scene is a DIFFERENT moment in the story.\n• BACKGROUND elements — details from the cover do NOT appear on this page unless this page's brief explicitly calls for them. Compose the background from this page's scene description, not from the reference.\n• SIGNATURE FLORA / FAUNA from the cover (bluebells, daisies, ferns, mushrooms, butterflies, etc.) — if the cover features a signature element, it does NOT automatically appear on this page. Add it ONLY when this page's brief explicitly names it. At least 30% of interior pages should have no signature element from the cover at all.\n• COMPOSITION / layout — character placement, depth layering, foreground/midground/background arrangement. All fresh per page.\n\nRULE OF THUMB: take the characters out of the reference and put them in a COMPLETELY DIFFERENT picture this time, doing whatever this page's scene says they're doing. Compose from scratch from the brief below; the reference is a CHARACTER MUGSHOT, not a scene template. If the new page would look like a near-duplicate of the reference with characters slightly rearranged, you are doing it wrong.`;
}

function isStoryCharacter(value: unknown): value is StoryCharacter {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as StoryCharacter).name === "string" &&
    (value as StoryCharacter).name.trim().length > 0 &&
    typeof (value as StoryCharacter).descriptor === "string" &&
    (value as StoryCharacter).descriptor.trim().length > 0
  );
}

function isDialogueLine(value: unknown): value is StoryDialogueLine {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as StoryDialogueLine).speaker === "string" &&
    (value as StoryDialogueLine).speaker.trim().length > 0 &&
    typeof (value as StoryDialogueLine).text === "string" &&
    (value as StoryDialogueLine).text.trim().length > 0
  );
}

function isPalette(value: unknown): value is StoryPalette {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as StoryPalette).name === "string" &&
    Array.isArray((value as StoryPalette).hexes)
  );
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

const NARRATION_MAX_WORDS: Record<AgeBand, number> = {
  toddlers: 14,
  kids: 22,
  tweens: 30,
};
const MAX_DIALOGUE_LINES = 2;
const MAX_CHARACTERS = 3;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const band = normalizeAgeBand(body.ageBand);
  const bubbleMax = DIALOGUE_MAX_WORDS[band];
  const narrationMax = NARRATION_MAX_WORDS[band];

  const characters = Array.isArray(body.characters)
    ? body.characters.filter(isStoryCharacter).slice(0, MAX_CHARACTERS)
    : [];
  const palette = isPalette(body.palette) ? body.palette : null;
  const scene = body.scene?.trim();
  if (!palette) {
    return NextResponse.json(
      { error: "palette is required ({ name, hexes })." },
      { status: 400 },
    );
  }
  if (!scene) {
    return NextResponse.json(
      { error: "scene is required (12-30 word description)." },
      { status: 400 },
    );
  }
  if (characters.length === 0) {
    return NextResponse.json(
      { error: "At least one locked character is required." },
      { status: 400 },
    );
  }

  const charge = await preauthorizeCharge(req, {
    kind: "story",
    op: "page",
  });
  if (!charge.ok) return charge.response;

  const rawDialogue = Array.isArray(body.dialogue)
    ? body.dialogue.filter(isDialogueLine)
    : [];
  const dialogue = dedupeDialogue(rawDialogue).slice(0, MAX_DIALOGUE_LINES);
  const validSpeakers = new Set(characters.map((c) => c.name.trim()));
  for (const line of dialogue) {
    if (countWords(line.text) > bubbleMax) {
      return NextResponse.json(
        {
          error: `Dialogue line "${line.text}" exceeds the ${band}-band limit of ${bubbleMax} words.`,
        },
        { status: 400 },
      );
    }
    if (!validSpeakers.has(line.speaker.trim())) {
      return NextResponse.json(
        {
          error: `Dialogue speaker "${line.speaker}" is not a locked character. Speakers must match a name in the characters array.`,
        },
        { status: 400 },
      );
    }
  }

  const narrationRaw = body.narration?.trim();
  if (narrationRaw && countWords(narrationRaw) > narrationMax) {
    return NextResponse.json(
      {
        error: `Narration exceeds the ${band}-band limit of ${narrationMax} words.`,
      },
      { status: 400 },
    );
  }
  const narration = narrationRaw
    ? ensureTerminalPunctuation(narrationRaw)
    : undefined;

  const extraImages: Array<{ mimeType: string; data: string }> = [];
  let hasCover = false;
  let hasChain = false;
  if (body.coverReferenceDataUrl) {
    const parsed = parseDataUrl(body.coverReferenceDataUrl);
    if (parsed) {
      extraImages.push(parsed);
      hasCover = true;
    }
  }
  if (
    body.chainReferenceDataUrl &&
    body.chainReferenceDataUrl !== body.coverReferenceDataUrl
  ) {
    const parsed = parseDataUrl(body.chainReferenceDataUrl);
    if (parsed) {
      extraImages.push(parsed);
      hasChain = true;
    }
  }

  const systemInstruction = buildStoryPageSystem(band);
  const userText = buildStoryPageUser({
    ageBand: band,
    characters,
    palette,
    scene,
    dialogue,
    narration,
    composition: body.composition?.trim(),
    coverStyle: body.coverStyle,
  });
  const anchor = buildConsistencyAnchorPreamble(hasCover, hasChain);
  const fullPrompt = anchor ? `${anchor} ${userText}` : userText;

  if (`${systemInstruction} ${fullPrompt}`.length > 35000) {
    return NextResponse.json(
      { error: "Prompt too long (max 35000 chars)." },
      { status: 400 },
    );
  }

  const resolvedModel: ImageModel = isImageModel(body.model)
    ? body.model
    : DEFAULT_COVER_MODEL;

  try {
    const start = Date.now();
    const image = await generateImageByModel(fullPrompt, {
      aspectRatio: "2:3",
      model: resolvedModel,
      systemInstruction,
      extraImages: extraImages.length ? extraImages : undefined,
    });
    const dataUrl = `data:${image.mimeType};base64,${image.data}`;
    await charge.commit("Generated story page");
    return NextResponse.json({
      dataUrl,
      model: resolvedModel,
      elapsedMs: Date.now() - start,
      anchored: { cover: hasCover, chain: hasChain },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Story page generation failed" },
      { status: 500 },
    );
  }
}
