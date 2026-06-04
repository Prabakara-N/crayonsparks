// Improve the user's short coloring-book idea into a richer planner-ready
// brief. One LLM call, returns plain text. No image gen, no credit charge.

import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { readBoundedJson } from "@/lib/api/bounded-json";
import { OPENAI_TEXT_MODEL } from "@/lib/constants";
import { userInput } from "@/lib/prompts/sanitize";
import {
  IMPROVE_ACTIVITY_IDEA_SYSTEM,
  IMPROVE_COLORING_IDEA_SYSTEM,
} from "@/lib/prompts/idea-improve";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  idea?: string;
  ageBand?: string;
  pageCount?: number;
  detailLevel?: string;
  bookKind?: string;
  activities?: unknown;
}

export async function POST(req: Request) {
  const parsed = await readBoundedJson<Body>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const idea = (body.idea ?? "").trim();
  if (!idea || idea.length < 5) {
    return NextResponse.json(
      { error: "idea must be at least 5 characters." },
      { status: 400 },
    );
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const isActivity = body.bookKind === "activity";
  const activities = Array.isArray(body.activities)
    ? body.activities
        .filter((x): x is string => typeof x === "string")
        .map((x) => userInput(x.trim()).slice(0, 40))
        .filter(Boolean)
        .slice(0, 16)
    : [];

  const contextLines: string[] = [];
  if (body.ageBand) contextLines.push(`Age band: ${userInput(body.ageBand)}`);
  if (body.pageCount)
    contextLines.push(`Page count target: ${body.pageCount}`);
  if (isActivity) {
    contextLines.push(
      activities.length
        ? `Chosen activity types: ${activities.join(", ")}`
        : "Chosen activity types: none — keep the mix general.",
    );
  } else if (body.detailLevel) {
    contextLines.push(`Detail level: ${userInput(body.detailLevel)}`);
  }

  const context =
    contextLines.length > 0 ? `\n\nContext:\n${contextLines.join("\n")}` : "";
  const bookNoun = isActivity ? "activity-book" : "coloring-book";
  const userPrompt = `User's idea:\n${userInput(idea)}${context}\n\nRewrite the idea into a richer ${bookNoun} brief per your instructions. Output only the rewritten paragraph.`;

  try {
    const result = await generateText({
      model: openai(OPENAI_TEXT_MODEL),
      system: isActivity ? IMPROVE_ACTIVITY_IDEA_SYSTEM : IMPROVE_COLORING_IDEA_SYSTEM,
      prompt: userPrompt,
    });
    const improved = result.text
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/^Here(?:'s| is) [^:]*:\s*/i, "")
      .replace(/^Improved (?:idea|brief):\s*/i, "")
      .trim();
    if (!improved || improved.length < 30) {
      return NextResponse.json(
        { error: "Improve failed — empty or too short response." },
        { status: 502 },
      );
    }
    return NextResponse.json({ idea: improved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Improve failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
