// Flattens speech-bubble overlays into a story page PNG at export time.
// The image and bubble coords come from the client (already in their
// possession) — no model call, no credit charge.

import { NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/api/bounded-json";
import { compositeBubblesOnImage } from "@/lib/page-bubble-composite";
import type { StoryBubble } from "@/lib/story-bubble-seed";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  imageDataUrl?: string;
  bubbles?: StoryBubble[];
}

function parseDataUrl(value: unknown): { base64: string } | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^data:image\/(?:png|jpeg|webp);base64,(.+)$/);
  if (!match) return null;
  return { base64: match[1] };
}

const VALID_SHAPES = new Set(["speech", "comic", "thought", "narration"]);

function isStoryBubble(value: unknown): value is StoryBubble {
  if (!value || typeof value !== "object") return false;
  const b = value as Record<string, unknown>;
  const baseOk =
    typeof b.id === "string" &&
    typeof b.text === "string" &&
    typeof b.x === "number" &&
    typeof b.y === "number" &&
    typeof b.width === "number" &&
    typeof b.tailTipX === "number" &&
    typeof b.tailTipY === "number";
  if (!baseOk) return false;
  if (b.height !== undefined && typeof b.height !== "number") return false;
  if (b.shape !== undefined && (typeof b.shape !== "string" || !VALID_SHAPES.has(b.shape))) {
    return false;
  }
  if (b.fontFamily !== undefined && typeof b.fontFamily !== "string") {
    return false;
  }
  if (
    b.fillColor !== undefined &&
    (typeof b.fillColor !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(b.fillColor))
  ) {
    return false;
  }
  if (
    b.textColor !== undefined &&
    (typeof b.textColor !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(b.textColor))
  ) {
    return false;
  }
  if (
    b.strokeColor !== undefined &&
    (typeof b.strokeColor !== "string" ||
      !/^#[0-9A-Fa-f]{6}$/.test(b.strokeColor))
  ) {
    return false;
  }
  if (
    b.fontSize !== undefined &&
    (typeof b.fontSize !== "number" || b.fontSize < 8 || b.fontSize > 72)
  ) {
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  const body = await readBoundedJson<Body>(req, 12 * 1024 * 1024);
  if (!body.ok) return body.response;

  const parsed = parseDataUrl(body.body.imageDataUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: "imageDataUrl must be a data URL (image/png|jpeg|webp)." },
      { status: 400 },
    );
  }

  const bubbles = Array.isArray(body.body.bubbles)
    ? body.body.bubbles.filter(isStoryBubble)
    : [];

  if (bubbles.length === 0) {
    return NextResponse.json(
      { dataUrl: body.body.imageDataUrl, flattened: false },
      { status: 200 },
    );
  }

  try {
    const result = await compositeBubblesOnImage({
      imageBase64: parsed.base64,
      bubbles,
    });
    return NextResponse.json({
      dataUrl: `data:${result.mimeType};base64,${result.base64}`,
      flattened: true,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bake failed" },
      { status: 500 },
    );
  }
}
