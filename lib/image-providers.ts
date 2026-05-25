/**
 * Image-generation dispatcher. Routes a single call to the right provider
 * (Gemini Nano Banana family or OpenAI gpt-image-* family) based on the
 * model id. Both providers return the same `{ mimeType, data }` shape so
 * call sites stay provider-agnostic.
 */

import {
  isGeminiImageModel,
  isOpenAiImageModel,
  DEFAULT_INTERIOR_MODEL,
} from "./constants";
import type { ImageModel } from "./constants";
import { generateColoringImage } from "./gemini";
import type { GenerateImageResult, GenerateOptions } from "./gemini";
import { generateOpenAiImage } from "./openai-image";
import { trimUniformBorders } from "./image-post-process";

export interface DispatchOptions extends Omit<GenerateOptions, "model"> {
  model: ImageModel;
}

/**
 * Generate an image using whichever provider owns `opts.model`.
 *
 * - Gemini models: forwarded to `generateColoringImage` with the existing
 *   GenerateOptions shape (multi-image references, systemInstruction
 *   caching, etc.).
 * - OpenAI models: forwarded to `generateOpenAiImage` which uses the
 *   /images/edits endpoint when reference images are supplied and
 *   /images/generations otherwise.
 */
export async function generateImageByModel(
  prompt: string,
  opts: DispatchOptions,
): Promise<GenerateImageResult> {
  const raw = isOpenAiImageModel(opts.model)
    ? await generateOpenAiImage(prompt, { ...opts, model: opts.model })
    : isGeminiImageModel(opts.model)
      ? await generateColoringImage(prompt, { ...opts, model: opts.model })
      : await generateColoringImage(prompt, {
          ...opts,
          model: DEFAULT_INTERIOR_MODEL,
        });
  return trimUniformBorders(raw);
}
