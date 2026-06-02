import { NextResponse } from "next/server";
import { getActivityGenerator } from "@/lib/activities";
import { rasterizeActivitySvg } from "@/lib/activity-rasterize";
import type { ActivitySpec, ActivityType } from "@/lib/activities/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function demoSpec(type: ActivityType, seed: number): ActivitySpec {
  const base = {
    id: `spike-${type}-${seed}`,
    type,
    theme: "ocean",
    difficulty: "medium" as const,
    ageBand: "kids" as const,
  };
  const map: Record<string, ActivitySpec["params"]> = {
    maze: { seed },
    "word-search": { seed, words: ["WHALE", "CORAL", "OCTOPUS", "DOLPHIN", "SHARK", "TURTLE", "CRAB", "SEAL"] },
    crossword: { seed },
    "letter-tracing": { seed, letters: ["B"] },
    "number-tracing": { seed, numbers: [7] },
    "sight-word-tracing": { seed, phrase: "I can swim" },
    "dot-to-dot": { seed, shape: "heart" },
    matching: { seed },
    counting: { seed },
  };
  const params = map[type] ?? { seed };
  return { ...base, title: type.replace(/-/g, " "), params };
}

// Phase 0/1 spike — dev-only. GET /api/dev/activity-spike?type=maze&solution=1&format=png
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "maze") as ActivityType;
  const wantSolution = url.searchParams.get("solution") === "1";
  const format = url.searchParams.get("format") ?? "png";
  const seed = Number(url.searchParams.get("seed") ?? "1");

  const generator = getActivityGenerator(type);
  if (!generator) {
    return NextResponse.json({ error: `No generator for type "${type}".` }, { status: 400 });
  }
  const result = generator.generate(demoSpec(type, seed));
  const svg = wantSolution && result.solutionSvg ? result.solutionSvg : result.svg;

  if (format === "svg") return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml" } });
  if (format === "meta") return NextResponse.json(result.meta);

  const png = await rasterizeActivitySvg(svg);
  return new NextResponse(Buffer.from(png.base64, "base64"), {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
