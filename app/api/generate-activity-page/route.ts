import { NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/api/bounded-json";
import { requireAuth } from "@/lib/auth/server-require-auth";
import { preauthorizeCharge } from "@/lib/credits/charge";
import { generateImageByModel } from "@/lib/image-providers";
import {
  DEFAULT_INTERIOR_MODEL,
  GPT_IMAGE_1_MINI,
  NANO_BANANA_25,
  GPT_IMAGE_1,
  type ImageModel,
} from "@/lib/constants";
import { getActivityGenerator } from "@/lib/activities";
import { rasterizeActivitySvg } from "@/lib/activity-rasterize";
import { SEEK_AND_FIND_PROMPT } from "@/lib/prompts/activities/seek-and-find";
import { COLOR_BY_NUMBER_PROMPT } from "@/lib/prompts/activities/color-by-number";
import { LETTER_REFERENCE_PROMPT } from "@/lib/prompts/activities/letter-reference";
import { OBJECT_CUE_PROMPT, NUMBER_CUE_PROMPT } from "@/lib/prompts/activities/object-cue";
import { DOT_SILHOUETTE_PROMPT } from "@/lib/prompts/activities/dot-silhouette";
import { traceOutlineToPoints } from "@/lib/activities/trace-outline";
import {
  SPOT_DIFFERENCE_PROMPT,
  SPOT_DIFFERENCE_CHANGES_PROMPT,
  SPOT_DIFFERENCE_CIRCLE_PROMPT,
} from "@/lib/prompts/activities/spot-difference";
import { generateSpotDifference, spotDifferenceCount } from "@/lib/activities/spot-difference";
import {
  COLOR_REFERENCE_COLOR_PROMPT,
  COLOR_REFERENCE_BW_PROMPT,
} from "@/lib/prompts/activities/color-reference";
import { generateColorReference } from "@/lib/activities/color-reference";
import { generateMatching } from "@/lib/activities/matching";
import { generateCounting } from "@/lib/activities/counting";
import { generatePatterns } from "@/lib/activities/patterns";
import { generateSorting } from "@/lib/activities/sorting";
import type { ObjectAssets } from "@/lib/activities/object-draw";
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

// Color picture-activities (color-reference, color spot-difference) may pick
// between Nano Banana 2.5 and GPT Image 1; anything else falls back to default.
const ACTIVITY_IMAGE_MODELS: ImageModel[] = [NANO_BANANA_25, GPT_IMAGE_1];
function pickActivityModel(m: unknown): ImageModel {
  return typeof m === "string" && ACTIVITY_IMAGE_MODELS.includes(m as ImageModel)
    ? (m as ImageModel)
    : DEFAULT_INTERIOR_MODEL;
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

const HYBRID_FNS: Record<string, (spec: ActivitySpec, objects?: ObjectAssets) => ActivityResult> = {
  matching: generateMatching,
  counting: generateCounting,
  patterns: generatePatterns,
  sorting: generateSorting,
};

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

  const refWord =
    (spec.type === "letter-tracing" || spec.type === "number-tracing") &&
    typeof spec.params.referenceWord === "string"
      ? spec.params.referenceWord.trim()
      : "";
  const aiObjects =
    spec.type in HYBRID_FNS && Array.isArray(spec.params.aiObjects)
      ? spec.params.aiObjects
          .filter((w): w is string => typeof w === "string" && !!w.trim())
          .map((w) => w.trim())
          .slice(0, 8)
      : [];
  const dotSubject =
    spec.type === "dot-to-dot" &&
    spec.params.aiTrace === true &&
    typeof spec.params.shape === "string"
      ? spec.params.shape.trim()
      : "";

  try {
    // Procedural pages: free, no model call. (Tracing cues / AI pictures /
    // AI-traced dot-to-dot fall through to the charged branches below.)
    if (generator.isProcedural && !refWord && !aiObjects.length && !dotSubject) {
      const auth = await requireAuth(req);
      if (!auth.ok) return auth.response;
      return NextResponse.json(await rasterizeResult(generator.generate(spec)));
    }

    // Dynamic dot-to-dot: AI draws a solid silhouette of the theme subject, we
    // trace it into numbered dots. Cheap Flash model, reduced (refine) charge.
    if (dotSubject) {
      const charge = await preauthorizeCharge(req, { kind: "activity", op: "refine" });
      if (!charge.ok) return charge.response;
      const pointCount =
        spec.difficulty === "easy" ? 12 : spec.difficulty === "hard" ? 20 : 16;
      let points: { x: number; y: number }[] = [];
      try {
        const image = await generateImageByModel(
          DOT_SILHOUETTE_PROMPT({ subject: dotSubject, theme: spec.theme }),
          { aspectRatio: "1:1", model: GPT_IMAGE_1_MINI },
        );
        points = await traceOutlineToPoints(
          `data:${image.mimeType};base64,${image.data}`,
          pointCount,
        );
      } catch {
        points = [];
      }
      const finalSpec =
        points.length >= 5
          ? { ...spec, params: { ...spec.params, dotPoints: points } }
          : spec;
      const payload = await rasterizeResult(generator.generate(finalSpec));
      await charge.commit("Activity: dot-to-dot page (AI subject)");
      return NextResponse.json(payload);
    }

    // Tracing picture cue ("A is for Apple" / "2 is for two apples").
    if (refWord) {
      const charge = await preauthorizeCharge(req, { kind: "coloring", op: "page" });
      if (!charge.ok) return charge.response;
      const prompt =
        spec.type === "number-tracing"
          ? NUMBER_CUE_PROMPT({
              n: Number(spec.params.numbers?.[0] ?? 1) || 1,
              word: refWord,
              theme: spec.theme,
            })
          : LETTER_REFERENCE_PROMPT({
              letter: (spec.params.letters?.[0] ?? "A").toUpperCase().slice(0, 1),
              word: refWord,
              theme: spec.theme,
            });
      const image = await generateImageByModel(prompt, {
        aspectRatio: "1:1",
        model: DEFAULT_INTERIOR_MODEL,
      });
      const asset = `data:${image.mimeType};base64,${image.data}`;
      const payload = await rasterizeResult(generator.generate(spec, asset));
      await charge.commit("Activity: tracing picture cue");
      return NextResponse.json(payload);
    }

    // Hybrid pages (matching/counting/patterns/sorting) with AI-drawn objects:
    // generate one picture per distinct object, then the procedural layout keeps
    // the count / pattern / odd-one-out logic correct.
    if (aiObjects.length) {
      const charge = await preauthorizeCharge(req, { kind: "coloring", op: "page" });
      if (!charge.ok) return charge.response;
      const pairs = await Promise.all(
        aiObjects.map(async (word) => {
          const image = await generateImageByModel(
            OBJECT_CUE_PROMPT({ word, theme: spec.theme }),
            { aspectRatio: "1:1", model: DEFAULT_INTERIOR_MODEL },
          );
          return [word.toLowerCase(), `data:${image.mimeType};base64,${image.data}`] as const;
        }),
      );
      const objects: ObjectAssets = Object.fromEntries(pairs);
      const payload = await rasterizeResult(HYBRID_FNS[spec.type](spec, objects));
      await charge.commit(`Activity: ${spec.type} page (AI pictures)`);
      return NextResponse.json(payload);
    }

    // Spot-the-difference: a REAL game — Picture 1, then Picture 2 with genuine
    // changes (img2img), then an answer key that circles the actual differences.
    if (spec.type === "spot-difference") {
      const charge = await preauthorizeCharge(req, { kind: "activity", op: "page" });
      if (!charge.ok) return charge.response;
      const count = spotDifferenceCount(spec);
      const isColor = spec.params.color === true;
      const specWithCount = { ...spec, params: { ...spec.params, differenceCount: count } };
      const model = pickActivityModel(spec.params.model);
      const img1 = await generateImageByModel(
        SPOT_DIFFERENCE_PROMPT({ theme: spec.theme, color: isColor }),
        { aspectRatio: "4:3", model },
      );
      const ref1 = { mimeType: img1.mimeType, data: img1.data };
      const p1 = `data:${img1.mimeType};base64,${img1.data}`;
      const img2 = await generateImageByModel(
        SPOT_DIFFERENCE_CHANGES_PROMPT({ count, color: isColor }),
        { aspectRatio: "4:3", model, sourceImage: ref1 },
      );
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
      await charge.commit("Activity: spot-difference page");
      return NextResponse.json(payload);
    }

    // Color-by-reference: a small COLOR picture (the reference), then the SAME
    // picture redrawn as B&W line art (img2img) for the child to color to match.
    if (spec.type === "color-reference") {
      const charge = await preauthorizeCharge(req, { kind: "coloring", op: "page" });
      if (!charge.ok) return charge.response;
      const subject =
        (typeof spec.params.shape === "string" && spec.params.shape.trim()) ||
        spec.theme ||
        "a friendly cartoon animal";
      const model = pickActivityModel(spec.params.model);
      const colorImg = await generateImageByModel(
        COLOR_REFERENCE_COLOR_PROMPT({ theme: spec.theme, subject }),
        { aspectRatio: "1:1", model },
      );
      const colorUrl = `data:${colorImg.mimeType};base64,${colorImg.data}`;
      const bwImg = await generateImageByModel(COLOR_REFERENCE_BW_PROMPT(), {
        aspectRatio: "1:1",
        model,
        sourceImage: { mimeType: colorImg.mimeType, data: colorImg.data },
      });
      const bwUrl = `data:${bwImg.mimeType};base64,${bwImg.data}`;
      const payload = await rasterizeResult(
        generateColorReference(spec, colorUrl, bwUrl),
      );
      await charge.commit("Activity: color-by-reference page");
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
    await charge.commit(`Activity: ${spec.type} page`);
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not generate the activity page.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
