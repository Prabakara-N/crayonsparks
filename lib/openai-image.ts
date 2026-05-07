/**
 * OpenAI image generation — gpt-image-1 / gpt-image-1-mini / gpt-image-1.5.
 *
 * All calls go through OpenAI's HTTP API directly via fetch. We tried the
 * AI SDK's `generateImage` + `openai.image(...)` factory first, but the
 * SDK pins a hard-coded model allowlist and rejects gpt-image-1.5 with an
 * "unknown model" error — so the SDK only worked for some of our model
 * options. Since the multi-image chain-reference flow needs raw fetch
 * for the multipart `/v1/images/edits` endpoint anyway, we just route
 * everything through fetch and keep the implementation simple +
 * forward-compatible (a future model id we add to constants.ts works
 * automatically without waiting on an SDK update).
 *
 *   no reference image  → POST /v1/images/generations  (JSON body)
 *   with reference image → POST /v1/images/edits       (multipart form)
 *
 * Both endpoints use the same Bearer auth + return the same `b64_json`
 * payload shape.
 */

import { GPT_IMAGE_1_MINI } from "./constants";
import type { OpenAiImageModel } from "./constants";
import type {
  AspectRatio,
  GenerateImageResult,
  GenerateOptions,
} from "./gemini";

/**
 * Map our internal aspect-ratio strings to the closest OpenAI-supported
 * size. gpt-image-1 only accepts 1024x1024, 1024x1536, 1536x1024 (plus
 * "auto"). For non-matching ratios we round to the nearest supported
 * orientation — the caller still gets a well-formed image; per-page
 * letterbox layout in pdf-lib + the FILL_CANVAS_RULE handle the rest.
 */
function aspectToSize(aspect: AspectRatio | undefined): string {
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
 * gpt-image-1 supports a `quality` parameter (low/medium/high). We default
 * to medium — a reasonable balance for kids' coloring books and the bulk
 * cost stays predictable. The mini variant only honours low/medium.
 */
function defaultQuality(model: OpenAiImageModel): "low" | "medium" | "high" {
  if (model === GPT_IMAGE_1_MINI) return "low";
  return "medium";
}

function requireApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured — set it in .env.local before using gpt-image models.",
    );
  }
  return apiKey;
}

function dataUrlPartsToBlob(part: { mimeType: string; data: string }): Blob {
  const bin = Buffer.from(part.data, "base64");
  return new Blob([bin], { type: part.mimeType || "image/png" });
}

interface OpenAiImageResponse {
  data?: Array<{ b64_json?: string }>;
  error?: { message?: string };
}

function readImageOrThrow(
  json: OpenAiImageResponse,
  endpoint: string,
): GenerateImageResult {
  const first = json.data?.[0];
  if (!first?.b64_json) {
    throw new Error(
      `OpenAI returned no image data from ${endpoint} (the model may have refused the prompt — try softer language).`,
    );
  }
  return { mimeType: "image/png", data: first.b64_json };
}

async function callImagesGenerations(
  prompt: string,
  model: OpenAiImageModel,
  size: string,
): Promise<GenerateImageResult> {
  const apiKey = requireApiKey();
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality: defaultQuality(model),
      n: 1,
    }),
  });
  const json = (await res.json()) as OpenAiImageResponse;
  if (!res.ok) {
    throw new Error(
      json.error?.message ?? `OpenAI image generation failed (${res.status})`,
    );
  }
  return readImageOrThrow(json, "/v1/images/generations");
}

async function callImagesEdits(
  prompt: string,
  refs: Array<{ mimeType: string; data: string }>,
  model: OpenAiImageModel,
  size: string,
): Promise<GenerateImageResult> {
  const apiKey = requireApiKey();
  const form = new FormData();
  form.set("model", model);
  form.set("prompt", prompt);
  form.set("size", size);
  form.set("quality", defaultQuality(model));
  form.set("n", "1");
  refs.forEach((ref, i) => {
    form.append("image[]", dataUrlPartsToBlob(ref), `ref_${i}.png`);
  });
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const json = (await res.json()) as OpenAiImageResponse;
  if (!res.ok) {
    throw new Error(
      json.error?.message ?? `OpenAI image edit failed (${res.status})`,
    );
  }
  return readImageOrThrow(json, "/v1/images/edits");
}

/**
 * Generate an image with one of the gpt-image-* models. Routes to
 * /v1/images/edits when reference images are present (chain-anchor flow)
 * and /v1/images/generations otherwise.
 */
export async function generateOpenAiImage(
  prompt: string,
  opts: GenerateOptions & { model: OpenAiImageModel },
): Promise<GenerateImageResult> {
  const size = aspectToSize(opts.aspectRatio);
  const refs: Array<{ mimeType: string; data: string }> = [];
  if (opts.sourceImage) refs.push(opts.sourceImage);
  if (opts.extraImages?.length) refs.push(...opts.extraImages);

  const fullPrompt = opts.systemInstruction
    ? `${opts.systemInstruction}\n\n${prompt}`
    : prompt;

  if (refs.length > 0) {
    return callImagesEdits(fullPrompt, refs, opts.model, size);
  }
  return callImagesGenerations(fullPrompt, opts.model, size);
}
