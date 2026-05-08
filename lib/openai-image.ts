/**
 * OpenAI image generation — gpt-image-1 / gpt-image-1-mini / gpt-image-1.5.
 *
 * Routed through the official `openai` SDK (typed, retries, file upload
 * helper). Two paths:
 *
 *   no reference image  → `client.images.generate(...)` → /v1/images/generations
 *   with reference image → `client.images.edit(...)`     → /v1/images/edits
 *
 * The SDK accepts `model` as a plain string, so any future gpt-image-X
 * id we add to `lib/constants.ts` works automatically — no SDK upgrade
 * required (the AI SDK's hard-coded model allowlist was the reason we
 * originally went raw-fetch; the OpenAI SDK doesn't have that limitation).
 */

import OpenAI, { toFile } from "openai";

import { GPT_IMAGE_1_MINI } from "./constants";
import type { OpenAiImageModel } from "./constants";
import type {
  AspectRatio,
  GenerateImageResult,
  GenerateOptions,
} from "./gemini";

let cachedClient: OpenAI | null = null;
function getClient(): OpenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured — set it in .env.local before using gpt-image models.",
    );
  }
  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

type OpenAiSize = "1024x1024" | "1024x1536" | "1536x1024" | "auto";

/**
 * Map our internal aspect-ratio strings to the closest OpenAI-supported
 * size. gpt-image-1 only accepts 1024x1024, 1024x1536, 1536x1024 (plus
 * "auto"). For non-matching ratios we round to the nearest supported
 * orientation — the caller still gets a well-formed image; pdf-lib's
 * `object-contain` letterbox + the FILL_CANVAS_RULE handle the rest.
 */
function aspectToSize(aspect: AspectRatio | undefined): OpenAiSize {
  switch (aspect) {
    case "3:4":
    case "2:3":
    case "9:16":
      return "1024x1536";
    case "4:3":
    case "3:2":
    case "16:9":
      return "1536x1024";
    case "1:1":
    default:
      return "1024x1024";
  }
}

/**
 * gpt-image-1 supports a `quality` parameter (low/medium/high). Default
 * to medium — a reasonable balance for kids' coloring books with
 * predictable bulk cost. The mini variant only honours low/medium.
 */
function defaultQuality(model: OpenAiImageModel): "low" | "medium" | "high" {
  if (model === GPT_IMAGE_1_MINI) return "low";
  return "medium";
}

async function refsToFiles(
  refs: ReadonlyArray<{ mimeType: string; data: string }>,
) {
  return Promise.all(
    refs.map((ref, i) =>
      toFile(Buffer.from(ref.data, "base64"), `ref_${i}.png`, {
        type: ref.mimeType || "image/png",
      }),
    ),
  );
}

function readImageOrThrow(
  result: { data?: Array<{ b64_json?: string | null }> | null },
  endpoint: string,
): GenerateImageResult {
  const first = result.data?.[0];
  const b64 = first?.b64_json;
  if (!b64) {
    throw new Error(
      `OpenAI returned no image data from ${endpoint} (the model may have refused the prompt — try softer language).`,
    );
  }
  return { mimeType: "image/png", data: b64 };
}

/**
 * Generate an image with one of the gpt-image-* models. Routes to
 * `images.edit` when reference images are present (chain-anchor flow)
 * and `images.generate` otherwise.
 */
export async function generateOpenAiImage(
  prompt: string,
  opts: GenerateOptions & { model: OpenAiImageModel },
): Promise<GenerateImageResult> {
  const client = getClient();
  const size = aspectToSize(opts.aspectRatio);
  const refs: Array<{ mimeType: string; data: string }> = [];
  if (opts.sourceImage) refs.push(opts.sourceImage);
  if (opts.extraImages?.length) refs.push(...opts.extraImages);

  const fullPrompt = opts.systemInstruction
    ? `${opts.systemInstruction}\n\n${prompt}`
    : prompt;

  if (refs.length > 0) {
    const images = await refsToFiles(refs);
    const result = await client.images.edit({
      model: opts.model,
      prompt: fullPrompt,
      image: images,
      size,
      quality: defaultQuality(opts.model),
      n: 1,
    });
    return readImageOrThrow(result, "images.edit");
  }

  const result = await client.images.generate({
    model: opts.model,
    prompt: fullPrompt,
    size,
    quality: defaultQuality(opts.model),
    n: 1,
  });
  return readImageOrThrow(result, "images.generate");
}
