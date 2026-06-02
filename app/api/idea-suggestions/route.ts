import { NextResponse } from "next/server";
import {
  generateIdeaSuggestions,
  type IdeaAudience,
  type IdeaKind,
  type IdeaStoryType,
} from "@/lib/idea-suggestions";

export const runtime = "nodejs";
export const maxDuration = 30;

const VALID_AUDIENCES: IdeaAudience[] = ["any", "toddlers", "kids", "tweens"];
const VALID_KINDS: IdeaKind[] = ["coloring", "story", "activity"];
const VALID_STORY_TYPES: IdeaStoryType[] = [
  "moral",
  "fiction",
  "non-fiction",
  "mystery",
  "fantasy",
  "comic",
  "fairytale",
  "adventure",
  "bedtime",
];

interface Body {
  audience?: IdeaAudience;
  kind?: IdeaKind;
  storyType?: IdeaStoryType | null;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }
  const audience: IdeaAudience =
    body.audience && VALID_AUDIENCES.includes(body.audience)
      ? body.audience
      : "any";
  const kind: IdeaKind =
    body.kind && VALID_KINDS.includes(body.kind) ? body.kind : "coloring";
  const storyType =
    kind === "story" && body.storyType && VALID_STORY_TYPES.includes(body.storyType)
      ? body.storyType
      : null;

  try {
    const ideas = await generateIdeaSuggestions(audience, kind, storyType);
    return NextResponse.json({ ideas });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Idea generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
