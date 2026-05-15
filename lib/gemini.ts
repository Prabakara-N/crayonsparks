import { GoogleGenAI } from "@google/genai";
import {
  DEFAULT_INTERIOR_MODEL,
  type ImageModel,
} from "@/lib/constants";
import { buildPromptSuggestions } from "@/lib/gemini-failure-suggestions";

let _client: GoogleGenAI | null = null;

function getClient() {
  const apiKey = process.env.GEMINI_NANO_BANANA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_NANO_BANANA_API_KEY is not set. Add it to .env.local — see .env.local.example for the template.",
    );
  }
  if (!_client) _client = new GoogleGenAI({ apiKey });
  return _client;
}

export type AspectRatio =
  | "1:1"
  | "3:4"
  | "4:3"
  | "9:16"
  | "16:9"
  | "2:3"
  | "3:2";

export const SUPPORTED_ASPECTS: AspectRatio[] = [
  "1:1",
  "3:4",
  "4:3",
  "2:3",
  "3:2",
  "9:16",
  "16:9",
];

export interface GenerateImageResult {
  mimeType: string;
  data: string;
}

export interface GenerateOptions {
  aspectRatio?: AspectRatio;
  sourceImage?: { mimeType: string; data: string };
  extraImages?: Array<{ mimeType: string; data: string }>;
  model?: ImageModel;
  systemInstruction?: string;
}

/** Gemini response metadata we surface for better error messages. */
interface CallResult {
  image: GenerateImageResult | null;
  finishReason?: string;
  blockReason?: string;
  textReply?: string;
}

function isTransientNetworkError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof Error && err.name === "AbortError") return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const code =
    (err as { code?: string; cause?: { code?: string } } | null)?.code ??
    (err as { cause?: { code?: string } } | null)?.cause?.code ??
    "";
  return (
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("socket") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("eai_again") ||
    msg.includes("enotfound") ||
    msg.includes("und_err") ||
    msg.includes("terminated") ||
    msg.includes("other side closed") ||
    msg.includes("503") ||
    msg.includes("502") ||
    msg.includes("504") ||
    code.startsWith("ECONN") ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN"
  );
}

async function callGemini(
  client: GoogleGenAI,
  prompt: string,
  opts: GenerateOptions,
): Promise<CallResult> {
  const aspectRatio = opts.aspectRatio ?? "1:1";

  const parts: Array<{
    text?: string;
    inlineData?: { mimeType: string; data: string };
  }> = [];
  if (opts.sourceImage) {
    parts.push({
      inlineData: {
        mimeType: opts.sourceImage.mimeType,
        data: opts.sourceImage.data,
      },
    });
  }
  if (opts.extraImages?.length) {
    for (const img of opts.extraImages) {
      parts.push({
        inlineData: { mimeType: img.mimeType, data: img.data },
      });
    }
  }
  parts.push({ text: prompt });

  const MAX_NETWORK_RETRIES = 3;
  let attempt = 0;
  let lastErr: unknown = null;
  let response: Awaited<
    ReturnType<typeof client.models.generateContent>
  > | null = null;
  // Caller may pass any ImageModel id (the union covers OpenAI too); the
  // dispatcher in lib/image-providers.ts is what actually narrows. Here we
  // fall back to the Gemini default if a non-Gemini id ever leaks through.
  const geminiModel: string =
    opts.model && opts.model.startsWith("gemini-")
      ? opts.model
      : DEFAULT_INTERIOR_MODEL;
  while (attempt < MAX_NETWORK_RETRIES) {
    try {
      response = await client.models.generateContent({
        model: geminiModel,
        contents: [{ role: "user", parts }],
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio },
          ...(opts.systemInstruction
            ? { systemInstruction: opts.systemInstruction }
            : {}),
        },
      });
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      attempt += 1;
      if (!isTransientNetworkError(err) || attempt >= MAX_NETWORK_RETRIES) {
        throw err;
      }
      const backoffMs = 600 * Math.pow(2, attempt - 1) + Math.random() * 300;
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  if (!response) {
    throw lastErr instanceof Error
      ? lastErr
      : new Error("Gemini call failed without a response.");
  }

  const candidate =
    response.candidates?.[0] ??
    (
      response as unknown as {
        response?: {
          candidates?: {
            finishReason?: string;
            content?: { parts?: unknown[] };
          }[];
          promptFeedback?: { blockReason?: string };
        };
      }
    ).response?.candidates?.[0];
  const promptFeedback =
    (
      response as unknown as {
        promptFeedback?: { blockReason?: string };
        response?: { promptFeedback?: { blockReason?: string } };
      }
    ).promptFeedback ??
    (
      response as unknown as {
        response?: { promptFeedback?: { blockReason?: string } };
      }
    ).response?.promptFeedback;

  const finishReason = (candidate as { finishReason?: string } | undefined)
    ?.finishReason;
  const blockReason = promptFeedback?.blockReason;
  const responseParts = (candidate?.content?.parts ?? []) as Array<{
    text?: string;
    inlineData?: { mimeType?: string; data?: string };
  }>;

  let textReply: string | undefined;
  for (const part of responseParts) {
    const inline = part.inlineData;
    if (inline?.data) {
      return {
        image: { mimeType: inline.mimeType ?? "image/png", data: inline.data },
        finishReason,
        blockReason,
      };
    }
    if (typeof part.text === "string" && part.text.trim()) {
      textReply = (textReply ? textReply + "\n" : "") + part.text.trim();
    }
  }

  return { image: null, finishReason, blockReason, textReply };
}

/** Best-effort heuristic for detecting Disney/IP-flavoured prompts. */
function smellsLikeIpRefusal(prompt: string, finishReason?: string): boolean {
  if (finishReason === "RECITATION" || finishReason === "PROHIBITED_CONTENT") {
    return true;
  }
  // Multi-trigger combination → likely IP overlap.
  const lower = prompt.toLowerCase();
  const hasMeerkatWarthog =
    /\bmeerkat\b/.test(lower) && /\bwarthog\b/.test(lower);
  const hasLionKingMotif =
    (/\blion\b/.test(lower) &&
      /\bcliff\b.*\bcub\b|\bcub\b.*\bcliff\b/.test(lower)) ||
    /\bcircle of life\b/.test(lower) ||
    /\bpride rock\b/.test(lower);
  return hasMeerkatWarthog || hasLionKingMotif;
}

/** Build a specific, user-readable failure message based on Gemini's signals. */
function buildFailureMessage(prompt: string, attempts: CallResult[]): string {
  const last = attempts[attempts.length - 1];
  const finish = last?.finishReason;
  const block = last?.blockReason;
  const textReply = last?.textReply;

  const suggestions = buildPromptSuggestions(prompt);
  const suggestionsBlock =
    suggestions.length > 0
      ? `\n\nTry rewording in the Refine modal — open this page, click "Refine", and ask Sparky to:\n  • ${suggestions.join("\n  • ")}`
      : `\n\nOpen the Refine modal on this page and ask Sparky to soften the wording (avoid scary, violent, or recognizable-IP terms; keep the page subject under ~200 words).`;

  // 1. Explicit copyright / IP recitation block.
  if (finish === "RECITATION" || smellsLikeIpRefusal(prompt, finish)) {
    return (
      "Gemini refused this scene because it's too close to a copyrighted work (likely Lion King / Disney style). The story arc is fine — only this specific scene's wording is the problem." +
      suggestionsBlock
    );
  }

  // 2. Explicit prohibited content / blocklist.
  if (finish === "PROHIBITED_CONTENT" || block === "PROHIBITED_CONTENT") {
    return (
      "Gemini blocked this prompt as prohibited content (typically violence, weapons, or unsafe-for-kids imagery)." +
      suggestionsBlock
    );
  }
  if (block === "BLOCKLIST") {
    return (
      "A specific word in this prompt is on Gemini's blocklist." +
      suggestionsBlock
    );
  }

  // 3. Safety filter (most common silent refusal for kids' content).
  if (finish === "SAFETY" || block === "SAFETY") {
    return (
      "Gemini's child-safety filter refused this prompt — usually triggered by 'scary', 'shadowy', 'held up high', 'scar', 'stampede', 'lightning', or 'cliff drop' wording. Same scene works with neutral wording." +
      suggestionsBlock
    );
  }

  // 4. Token / quota.
  if (finish === "MAX_TOKENS") {
    return "The prompt was too long for Gemini to render in one go. Open the Refine modal and ask Sparky to shorten this page subject — keep it under ~200 words.";
  }

  // 5. Model returned text instead of an image — usually a soft refusal.
  if (textReply) {
    const snippet =
      textReply.length > 220 ? textReply.slice(0, 217) + "…" : textReply;
    return (
      `Gemini replied with text instead of an image — that's a polite refusal. The model said: "${snippet}".` +
      suggestionsBlock
    );
  }

  // 6. Generic empty response — most often a silent safety/IP refusal.
  return (
    "Gemini returned an empty response — almost always a silent safety or copyright filter on the page wording. The error is on Google's side, not yours, but the fix is to reword the page." +
    suggestionsBlock
  );
}

function callGeminiOrNetworkError(
  client: GoogleGenAI,
  prompt: string,
  opts: GenerateOptions,
): Promise<CallResult> {
  return callGemini(client, prompt, opts).catch((err: unknown) => {
    if (isTransientNetworkError(err)) {
      throw new Error(
        "Network hiccup talking to Gemini (we already retried 3 times with backoff). The model is reachable but a connection kept dropping mid-request — usually a transient cloud-side issue. Wait 10–20 seconds and click Regenerate again.",
      );
    }
    throw err;
  });
}

export async function generateColoringImage(
  prompt: string,
  opts: GenerateOptions = {},
): Promise<GenerateImageResult> {
  const client = getClient();

  // Single attempt with the original prompt. Auto-rewrite chain
  // (rule-based soften + AI substitution) is intentionally disabled —
  // the user wants explicit control over retries, not silent prompt
  // mutation behind their back. When the prompt fails, the failure
  // message surfaces to the UI so the user can edit and retry.
  const first = await callGeminiOrNetworkError(client, prompt, opts);
  if (first.image) return first.image;
  throw new Error(buildFailureMessage(prompt, [first]));
}
