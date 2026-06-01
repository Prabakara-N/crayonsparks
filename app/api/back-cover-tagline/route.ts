/**
 * Back-cover tagline generator. The user picks one of the suggestions in
 * the refine modal and we render it onto the back cover via Gemini.
 *
 * Returns 4-5 short taglines (≤8 words each) tailored to the book's
 * title + theme. Cheap helper-model call, runs only when the
 * user opens the back-cover refine panel or clicks "Suggest more".
 */

import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { OPENAI_TEXT_MODEL } from "@/lib/constants";
import {
  ACTIVITY_BACK_COVER_TAGLINE_SYSTEM_PROMPT,
  BACK_COVER_TAGLINE_SYSTEM_PROMPT,
  STORY_BACK_COVER_TAGLINE_SYSTEM_PROMPT,
} from "@/lib/prompts/back-cover-tagline";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  bookTitle?: string;
  coverScene?: string;
  audience?: string;
  pageSubjects?: string[];
  pageCount?: number;
  variantSeed?: number;
  bookKind?: "coloring" | "story" | "activity";
}


const SCHEMA = z.object({
  taglines: z
    .array(z.string().min(8).max(130))
    .min(3)
    .max(5)
    .describe(
      "3-5 short tagline candidates of 10-12 words (1 or 2 short sentences), parent-first tone, calm & elegant.",
    ),
});

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const bookKind: "coloring" | "story" | "activity" =
    body.bookKind === "story" ? "story" : body.bookKind === "activity" ? "activity" : "coloring";
  const title =
    (body.bookTitle ?? "").trim() ||
    (bookKind === "story"
      ? "a kids' picture book"
      : bookKind === "activity"
        ? "a kids' activity book"
        : "a kids' coloring book");
  const scene = (body.coverScene ?? "").trim();
  const audience = (body.audience ?? "").trim();
  const subjects = (body.pageSubjects ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  const pageCount =
    typeof body.pageCount === "number" && body.pageCount > 0
      ? Math.floor(body.pageCount)
      : null;
  const variantNote =
    body.variantSeed && body.variantSeed > 0
      ? ` This is request #${body.variantSeed + 1} — your output MUST be MEANINGFULLY DIFFERENT from any prior batch you produced for this book. Pick fresh angles, fresh wording.`
      : "";
  const userPrompt =
    `Book: ${title}` +
    (audience ? `\nAudience (the child): ${audience}` : "") +
    (scene ? `\nCover scene: ${scene}` : "") +
    (subjects.length > 0
      ? `\nSubjects featured inside the book: ${subjects.join(", ")}`
      : "") +
    (pageCount !== null ? `\nPage count: ${pageCount}` : "") +
    `\n\nWrite 4 back-cover tagline candidates per the rules. Each tagline is 1-2 short sentences (10-12 words total, hard cap at 12). Speak to the PARENT first (warm, calm, evocative of quiet time together) while staying inviting to the child. Use concrete nouns from THIS book's subjects/scene — never generic "kids coloring book" language.${pageCount !== null ? ` You MAY mention the page count (${pageCount}) — spell as a word for ≤30, numerals for 31+.` : " Page count is NOT provided — do NOT mention any quantity, number, or 'twenty/thirty/many pages' phrasing."}${variantNote}`;

  try {
    const result = await generateObject({
      model: openai(OPENAI_TEXT_MODEL),
      system:
        bookKind === "story"
          ? STORY_BACK_COVER_TAGLINE_SYSTEM_PROMPT
          : bookKind === "activity"
            ? ACTIVITY_BACK_COVER_TAGLINE_SYSTEM_PROMPT
            : BACK_COVER_TAGLINE_SYSTEM_PROMPT,
      schema: SCHEMA,
      prompt: userPrompt,
    });
    const taglines = result.object.taglines
      .map((t) => t.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    if (taglines.length < 3) {
      return NextResponse.json(
        { error: "Tagline generation returned too few candidates." },
        { status: 502 },
      );
    }
    return NextResponse.json({ taglines });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Tagline generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
