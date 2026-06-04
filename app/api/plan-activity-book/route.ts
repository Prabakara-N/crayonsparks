import { NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/api/bounded-json";
import { requireAuth } from "@/lib/auth/server-require-auth";
import {
  planActivityBook,
  type ActivityBookPlanInput,
} from "@/lib/activity-book-planner";
import {
  PLANNABLE_TYPES,
  type ActivityCounts,
  type ActivityType,
} from "@/lib/activities/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Keep only known activity types with a sane positive page count.
function sanitizeCounts(raw: unknown, pageCount: number): ActivityCounts | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: ActivityCounts = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!PLANNABLE_TYPES.includes(key as ActivityType)) continue;
    const n = typeof value === "number" ? Math.round(value) : 0;
    if (n > 0) out[key as ActivityType] = clamp(n, 1, pageCount);
  }
  return Object.keys(out).length ? out : undefined;
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
  const counts = sanitizeCounts(body.counts, pageCount);

  try {
    const plan = await planActivityBook({
      idea,
      pageCount,
      age: body.age,
      difficulty: body.difficulty,
      mix: body.mix,
      counts,
      weights: body.weights,
      aiPictures: body.aiPictures === true,
      regenerationHint,
    });
    return NextResponse.json({ plan });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not plan the activity book.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
