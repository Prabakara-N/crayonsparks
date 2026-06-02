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
import {
  SPOT_DIFFERENCE_PROMPT,
  SPOT_DIFFERENCE_CHANGES_PROMPT,
  SPOT_DIFFERENCE_CIRCLE_PROMPT,
} from "@/lib/prompts/activities/spot-difference";
import { generateSpotDifference, spotDifferenceCount } from "@/lib/activities/spot-difference";
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

    // Spot-the-difference: a REAL game — Picture 1, then Picture 2 with genuine
    // changes (img2img), then an answer key that circles the actual differences.
    if (spec.type === "spot-difference") {
      const charge = await preauthorizeCharge(req, { kind: "activity", op: "page" });
      if (!charge.ok) return charge.response;
      const count = spotDifferenceCount(spec);
      const specWithCount = { ...spec, params: { ...spec.params, differenceCount: count } };
      const model = DEFAULT_INTERIOR_MODEL;
      const img1 = await generateImageByModel(SPOT_DIFFERENCE_PROMPT({ theme: spec.theme }), {
        aspectRatio: "4:3",
        model,
      });
      const ref1 = { mimeType: img1.mimeType, data: img1.data };
      const p1 = `data:${img1.mimeType};base64,${img1.data}`;
      const img2 = await generateImageByModel(SPOT_DIFFERENCE_CHANGES_PROMPT({ count }), {
        aspectRatio: "4:3",
        model,
        sourceImage: ref1,
      });
      const ref2 = { mimeType: img2.mimeType, data: img2.data };
      const p2 = `data:${img2.mimeType};base64,${img2.data}`;
      let p2c: string | undefined;
      try {
        const img3 = await generateImageByModel(SPOT_DIFFERENCE_CIRCLE_PROMPT({ count }), {
          aspectRatio: "4:3",
          model,
          sourceImage: ref2,
          extraImages: [ref1],
        });
        p2c = `data:${img3.mimeType};base64,${img3.data}`;
      } catch {
        p2c = undefined;
      }
      const payload = await rasterizeResult(generateSpotDifference(specWithCount, p1, p2, p2c));
      await charge.commit("Generated spot-difference page");
      return NextResponse.json(payload);
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
