import { NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/api/bounded-json";
import { requireAuth } from "@/lib/auth/server-require-auth";
import {
  planActivityBook,
  type ActivityBookPlanInput,
} from "@/lib/activity-book-planner";

export const runtime = "nodejs";
export const maxDuration = 60;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const parsed = await readBoundedJson<Partial<ActivityBookPlanInput>>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const idea = (body.idea ?? "").trim().slice(0, 500);
  if (!idea) {
    return NextResponse.json({ error: "An idea is required." }, { status: 400 });
  }
  const pageCount = clamp(Math.round(body.pageCount ?? 20), 4, 60);
  const regenerationHint = body.regenerationHint?.trim().slice(0, 200);

  try {
    const plan = await planActivityBook({
      idea,
      pageCount,
      age: body.age,
      difficulty: body.difficulty,
      mix: body.mix,
      weights: body.weights,
      regenerationHint,
    });
    return NextResponse.json({ plan });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not plan the activity book.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
