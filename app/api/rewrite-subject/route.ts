import { NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/api/bounded-json";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { OPENAI_TEXT_MODEL } from "@/lib/constants";
import { userInput } from "@/lib/prompts/sanitize";
import { REWRITE_SUBJECT_SYSTEM_PROMPT } from "@/lib/prompts/rewrite-subject";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  subject?: string;
  errorHint?: string;
  variantSeed?: number;
  bookTitle?: string;
  coverScene?: string;
  characterLock?: string;
}


export async function POST(req: Request) {
  const parsed = await readBoundedJson<Body>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const subject = (body.subject ?? "").trim();
  if (!subject || subject.length < 5) {
    return NextResponse.json(
      { error: "subject must be a non-empty string." },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const variantNote =
    body.variantSeed && body.variantSeed > 1
      ? ` (alt #${body.variantSeed} — this rewrite MUST be MEANINGFULLY DIFFERENT from any earlier alternative for the same subject; choose a different swap path for the SECONDARY characters or setting, but STILL keep the protagonist unchanged)`
      : "";

  const contextLines: string[] = [];
  if (body.bookTitle) {
    contextLines.push(`Book title: ${userInput(body.bookTitle)}`);
  }
  if (body.coverScene) {
    contextLines.push(
      `Cover scene (the book's main characters appear here): ${userInput(body.coverScene)}`,
    );
  }
  if (body.characterLock) {
    contextLines.push(
      `Protagonists (must be preserved verbatim across all pages): ${userInput(body.characterLock)}`,
    );
  }
  const contextBlock =
    contextLines.length > 0
      ? `\n\nBOOK CONTEXT (read this BEFORE rewriting):\n${contextLines.join("\n\n")}`
      : "";

  const fencedSubject = userInput(subject);
  const userPrompt = body.errorHint
    ? `Rejected subject:\n${fencedSubject}${contextBlock}\n\nGemini's signal: ${userInput(body.errorHint)}${variantNote}\n\nRewrite the subject so it passes — same scene, same protagonists, defanged wording.`
    : `Rejected subject:\n${fencedSubject}${contextBlock}${variantNote}\n\nRewrite the subject — same scene, same protagonists, IP/safety-safe wording.`;

  try {
    const result = await generateText({
      model: openai(OPENAI_TEXT_MODEL),
      system: REWRITE_SUBJECT_SYSTEM_PROMPT,
      prompt: userPrompt,
    });
    const alternative = result.text
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/^Rewrite:\s*/i, "")
      .replace(/^Rewritten subject:\s*/i, "")
      .trim();
    if (!alternative || alternative.length < 10) {
      return NextResponse.json(
        { error: "Rewrite failed — empty response." },
        { status: 502 },
      );
    }
    return NextResponse.json({ alternative });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rewrite failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
