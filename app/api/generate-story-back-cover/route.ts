// Story-book back-cover generation endpoint.
// Returns: { dataUrl, model, elapsedMs }

import { NextResponse } from "next/server";
import { generateImageByModel } from "@/lib/image-providers";
import { preauthorizeCharge } from "@/lib/credits/charge";
import {
  DEFAULT_COVER_MODEL,
  isImageModel,
  type ImageModel,
} from "@/lib/constants";
import {
  buildStoryBackCoverSystem,
  buildStoryBackCoverUser,
  TAGLINE_MAX_WORDS,
  type AgeBand,
  type StoryPalette,
} from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  title?: string;
  palette?: StoryPalette;
  tagline?: string;
  coverReferenceDataUrl?: string;
  forceColor?: string;
  ageBand?: AgeBand;
  model?: ImageModel;
}

const VALID_AGE_BANDS: readonly AgeBand[] = ["toddlers", "kids", "tweens"];

function normalizeAgeBand(value: unknown): AgeBand {
  return typeof value === "string" && (VALID_AGE_BANDS as readonly string[]).includes(value)
    ? (value as AgeBand)
    : "toddlers";
}

function isPalette(value: unknown): value is StoryPalette {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as StoryPalette).name === "string" &&
    Array.isArray((value as StoryPalette).hexes)
  );
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

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const band = normalizeAgeBand(body.ageBand);
  const taglineMax = TAGLINE_MAX_WORDS[band];

  const title = body.title?.trim();
  const tagline = body.tagline?.trim();
  const palette = isPalette(body.palette) ? body.palette : null;

  if (!title) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }
  if (!tagline) {
    return NextResponse.json(
      { error: "tagline is required." },
      { status: 400 },
    );
  }
  if (countWords(tagline) > taglineMax) {
    return NextResponse.json(
      {
        error: `Tagline exceeds the ${band}-band limit of ${taglineMax} words.`,
      },
      { status: 400 },
    );
  }
  if (!palette) {
    return NextResponse.json(
      { error: "palette is required ({ name, hexes })." },
      { status: 400 },
    );
  }

  const charge = await preauthorizeCharge(req, {
    kind: "story",
    op: "cover",
  });
  if (!charge.ok) return charge.response;

  const systemInstruction = buildStoryBackCoverSystem(band);
  const userText = buildStoryBackCoverUser({
    ageBand: band,
    title,
    palette,
    tagline,
    forceColor: body.forceColor?.trim() || undefined,
  });
  const fullPrompt = `${systemInstruction} ${userText}`;
  if (fullPrompt.length > 35000) {
    return NextResponse.json(
      { error: "Prompt too long (max 35000 chars)." },
      { status: 400 },
    );
  }

  const extraImages: Array<{ mimeType: string; data: string }> = [];
  if (body.coverReferenceDataUrl) {
    const parsed = parseDataUrl(body.coverReferenceDataUrl);
    if (parsed) extraImages.push(parsed);
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
    await charge.commit("Generated story back cover");
    return NextResponse.json({
      dataUrl: `data:${image.mimeType};base64,${image.data}`,
      model: resolvedModel,
      elapsedMs: Date.now() - start,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Story back-cover generation failed",
      },
      { status: 500 },
    );
  }
}
