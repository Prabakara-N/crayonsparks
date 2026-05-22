// Story-book front-cover generation endpoint.
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
  buildStoryCoverSystem,
  buildStoryCoverUser,
  type AgeBand,
  type StoryCharacter,
  type StoryPalette,
} from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  title?: string;
  characters?: StoryCharacter[];
  palette?: StoryPalette;
  coverScene?: string;
  coverComposition?: string;
  ageBand?: AgeBand;
  model?: ImageModel;
  audienceLabel?: string;
  pageCount?: number;
  bottomStripPhrases?: string[];
  sidePlaqueLines?: string[];
  coverBadgeStyle?: string;
  brandStrapline?: string;
  coverStyle?: "flat" | "illustrated";
  coverBorder?: "bleed" | "framed";
}

const VALID_AGE_BANDS: readonly AgeBand[] = ["toddlers", "kids", "tweens"];

function normalizeAgeBand(value: unknown): AgeBand {
  return typeof value === "string" && (VALID_AGE_BANDS as readonly string[]).includes(value)
    ? (value as AgeBand)
    : "toddlers";
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

function isPalette(value: unknown): value is StoryPalette {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as StoryPalette).name === "string" &&
    Array.isArray((value as StoryPalette).hexes)
  );
}

const MAX_CHARACTERS = 3;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = body.title?.trim();
  const coverScene = body.coverScene?.trim();
  const palette = isPalette(body.palette) ? body.palette : null;
  const characters = Array.isArray(body.characters)
    ? body.characters.filter(isStoryCharacter).slice(0, MAX_CHARACTERS)
    : [];

  if (!title) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }
  if (!coverScene) {
    return NextResponse.json(
      { error: "coverScene is required." },
      { status: 400 },
    );
  }
  if (!palette) {
    return NextResponse.json(
      { error: "palette is required ({ name, hexes })." },
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
    op: "cover",
  });
  if (!charge.ok) return charge.response;

  const band = normalizeAgeBand(body.ageBand);
  const systemInstruction = buildStoryCoverSystem(band);
  const userText = buildStoryCoverUser({
    ageBand: band,
    title,
    characters,
    palette,
    coverScene,
    composition: body.coverComposition?.trim(),
    audienceLabel: body.audienceLabel,
    pageCount: body.pageCount,
    bottomStripPhrases: body.bottomStripPhrases,
    sidePlaqueLines: body.sidePlaqueLines,
    coverBadgeStyle: body.coverBadgeStyle,
    brandStrapline: body.brandStrapline,
    coverStyle: body.coverStyle,
    coverBorder: body.coverBorder,
  });

  const fullPrompt = `${systemInstruction} ${userText}`;
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
      systemInstruction,
    });
    const dataUrl = `data:${image.mimeType};base64,${image.data}`;
    await charge.commit("Generated story cover");
    return NextResponse.json({
      dataUrl,
      model: resolvedModel,
      elapsedMs: Date.now() - start,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Story cover generation failed",
      },
      { status: 500 },
    );
  }
}
