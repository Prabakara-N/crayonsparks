import { NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/api/bounded-json";
import { requireAuth } from "@/lib/auth/server-require-auth";
import { preauthorizeCharge } from "@/lib/credits/charge";
import { generateImageByModel } from "@/lib/image-providers";
import { DEFAULT_INTERIOR_MODEL } from "@/lib/constants";
import { getActivityGenerator } from "@/lib/activities";
import { rasterizeActivitySvg } from "@/lib/activity-rasterize";
import { SEEK_AND_FIND_PROMPT } from "@/lib/prompts/activities/seek-and-find";
import { COLOR_BY_NUMBER_PROMPT } from "@/lib/prompts/activities/color-by-number";
import { SPOT_DIFFERENCE_PROMPT } from "@/lib/prompts/activities/spot-difference";
import { ACTIVITY_TYPES, type ActivityResult, type ActivitySpec, type ActivityType } from "@/lib/activities/types";

export const runtime = "nodejs";
export const maxDuration = 120;

function isValidSpec(spec: unknown): spec is ActivitySpec {
  if (!spec || typeof spec !== "object") return false;
  const s = spec as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    typeof s.type === "string" &&
    ACTIVITY_TYPES.includes(s.type as ActivityType) &&
    typeof s.title === "string" &&
    typeof s.difficulty === "string" &&
    !!s.params &&
    typeof s.params === "object"
  );
}

// Clamp client-supplied free text before it reaches an image-gen prompt.
function sanitizeSpec(spec: ActivitySpec): ActivitySpec {
  return {
    ...spec,
    title: String(spec.title).slice(0, 120),
    theme: typeof spec.theme === "string" ? spec.theme.slice(0, 80) : "",
  };
}

function illustratedPrompt(spec: ActivitySpec): string {
  if (spec.type === "spot-difference") {
    return SPOT_DIFFERENCE_PROMPT({ theme: spec.theme });
  }
  if (spec.type === "color-by-number") {
    return COLOR_BY_NUMBER_PROMPT({
      theme: spec.theme,
      legend: spec.params.paletteLegend ?? [
        { n: 1, label: "red" },
        { n: 2, label: "blue" },
        { n: 3, label: "green" },
        { n: 4, label: "yellow" },
      ],
    });
  }
  return SEEK_AND_FIND_PROMPT({
    theme: spec.theme,
    findList: spec.params.findList ?? [
      { label: "stars", count: 5 },
      { label: "fish", count: 4 },
    ],
  });
}

async function rasterizeResult(result: ActivityResult) {
  const [png, solutionPng] = await Promise.all([
    rasterizeActivitySvg(result.svg),
    result.solutionSvg ? rasterizeActivitySvg(result.solutionSvg) : Promise.resolve(null),
  ]);
  return {
    dataUrl: png.dataUrl,
    solutionDataUrl: solutionPng?.dataUrl ?? null,
    svg: result.svg,
    solutionSvg: result.solutionSvg ?? null,
    meta: result.meta,
  };
}

export async function POST(req: Request) {
  const parsed = await readBoundedJson<{ spec?: unknown }>(req);
  if (!parsed.ok) return parsed.response;
  if (!isValidSpec(parsed.body.spec)) {
    return NextResponse.json({ error: "Invalid activity spec." }, { status: 400 });
  }
  const spec = sanitizeSpec(parsed.body.spec);

  const generator = getActivityGenerator(spec.type);
  if (!generator) {
    return NextResponse.json(
      { error: "That activity type is not available." },
      { status: 400 },
    );
  }

  try {
    // Procedural pages: free, no model call.
    if (generator.isProcedural) {
      const auth = await requireAuth(req);
      if (!auth.ok) return auth.response;
      return NextResponse.json(await rasterizeResult(generator.generate(spec)));
    }

    // Illustrated pages: charged — generate an AI base scene, then overlay.
    const charge = await preauthorizeCharge(req, { kind: "coloring", op: "page" });
    if (!charge.ok) return charge.response;
    const image = await generateImageByModel(illustratedPrompt(spec), {
      aspectRatio: "3:4",
      model: DEFAULT_INTERIOR_MODEL,
    });
    const asset = `data:${image.mimeType};base64,${image.data}`;
    const result = generator.generate(spec, asset);
    const payload = await rasterizeResult(result);
    await charge.commit(`Generated ${spec.type} page`);
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not generate the activity page.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
