/**
 * Story-book page generation endpoint (Phase 1 — toddler band only).
 *
 * Distinct from /api/generate which serves the coloring-book product. This
 * route uses the toddler story-page prompt: full color, full bleed, speech
 * bubbles allowed. Output is a single 6x9 portrait illustration as a PNG
 * data URL.
 *
 * Body:
 *   {
 *     characters: [{ name, descriptor }, ...],   // 1-3 locked characters
 *     palette:    { name, hexes: [...] },
 *     scene:      string,                        // 12-30 word scene desc
 *     dialogue?:  [{ speaker, text }, ...],      // up to 2 bubbles, ≤12 words each
 *     narration?: string,                        // optional 1-line caption
 *     composition?: string,                      // optional camera/framing hint
 *     ageBand?:   "toddlers",                    // reserved for future bands
 *     model?:     ImageModel,              // optional override
 *   }
 */

import { NextResponse } from "next/server";
import { generateImageByModel } from "@/lib/image-providers";
import {
  DEFAULT_COVER_MODEL,
  isImageModel,
  type ImageModel,
} from "@/lib/constants";
import {
  STORY_PAGE_TODDLER_SYSTEM,
  STORY_PAGE_TODDLER_USER,
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
  ageBand?: "toddlers";
  model?: ImageModel;
  /**
   * "flat" (default) or "illustrated" — must match the cover's coverStyle
   * so interior pages render in the same visual language as the cover.
   */
  coverStyle?: "flat" | "illustrated";
  /**
   * Cover image of the same book — passed to Gemini as image 1. Anchors
   * the locked-character look and the book's overall visual language;
   * the cover is the ground truth for character design across every
   * interior page.
   */
  coverReferenceDataUrl?: string;
  /**
   * Previously generated interior page from this book — passed as image
   * 2 alongside the cover. Helps the new page match line weight, page
   * composition flow, and character pose continuity. Typically the page
   * immediately preceding this one.
   */
  chainReferenceDataUrl?: string;
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
  return `🚨 REFERENCE IMAGE USAGE — STRICT — ${refLabel}. The references serve ONE purpose: to lock the LOOK of the recurring characters across the book. NOTHING ELSE.\n\n✅ COPY from the references (these and ONLY these):\n• Each character's species, body proportions, head/face shape, fur / feather / skin color, eye style, markings, distinguishing accessories.\n• Overall illustrative style: line weight, color saturation, lighting feel, rendering polish.\n• Speech-bubble shape and lettering style (when bubbles already appeared on a prior page).\n\n❌ DO NOT COPY from the references (this list is load-bearing — copying any of these is the most common quality killer):\n• Character POSES — the cover shows characters standing in some specific way; the new page must show them in a DIFFERENT pose driven by THIS PAGE'S scene description below. Walking, sitting, climbing, lying, reaching, hugging, hiding, dancing — pick the pose from this page's brief, NOT from what they were doing on the cover.\n• Character POSITIONS / framing on the canvas — the cover's left-of-center elephant + right-of-center monkey arrangement does NOT carry over; this page composes fresh.\n• CAMERA angle and framing distance — alternate close-up / mid-shot / wide-shot across pages instead of cloning the cover's angle.\n• SCENE / setting / location — the cover is one scene; this page's scene is a DIFFERENT moment in the story (read the brief below for where this page takes place).\n• BACKGROUND elements — trees, foliage, sky, mountains, props, vines, bridge details from the cover do NOT appear on this page unless this page's brief explicitly calls for them. Compose the background from this page's scene description, not from the reference.\n• COMPOSITION / layout — character placement, depth layering, foreground/midground/background arrangement. All fresh per page.\n\nRULE OF THUMB: take the characters out of the reference and put them in a COMPLETELY DIFFERENT picture this time, doing whatever this page's scene says they're doing. Compose from scratch from the brief below; the reference is a CHARACTER MUGSHOT, not a scene template. If the new page would look like a near-duplicate of the reference with characters slightly rearranged, you are DOING IT WRONG.`;
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

const MAX_BUBBLE_WORDS = 12;
const MAX_NARRATION_WORDS = 14;
const MAX_DIALOGUE_LINES = 2;
const MAX_CHARACTERS = 3;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

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

  const dialogue = Array.isArray(body.dialogue)
    ? body.dialogue.filter(isDialogueLine).slice(0, MAX_DIALOGUE_LINES)
    : [];
  const validSpeakers = new Set(characters.map((c) => c.name.trim()));
  for (const line of dialogue) {
    if (countWords(line.text) > MAX_BUBBLE_WORDS) {
      return NextResponse.json(
        {
          error: `Dialogue line "${line.text}" exceeds the toddler-band limit of ${MAX_BUBBLE_WORDS} words.`,
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

  const narration = body.narration?.trim();
  if (narration && countWords(narration) > MAX_NARRATION_WORDS) {
    return NextResponse.json(
      {
        error: `Narration exceeds the toddler-band limit of ${MAX_NARRATION_WORDS} words.`,
      },
      { status: 400 },
    );
  }

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

  const userText = STORY_PAGE_TODDLER_USER({
    characters,
    palette,
    scene,
    dialogue,
    narration,
    composition: body.composition?.trim(),
    coverStyle: body.coverStyle,
  });
  const anchor = buildConsistencyAnchorPreamble(hasCover, hasChain);
  const fullPrompt = anchor
    ? `${STORY_PAGE_TODDLER_SYSTEM} ${anchor} ${userText}`
    : `${STORY_PAGE_TODDLER_SYSTEM} ${userText}`;

  if (fullPrompt.length > 35000) {
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
      systemInstruction: STORY_PAGE_TODDLER_SYSTEM,
      extraImages: extraImages.length ? extraImages : undefined,
    });
    const dataUrl = `data:${image.mimeType};base64,${image.data}`;
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
