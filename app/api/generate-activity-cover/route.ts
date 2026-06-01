import { NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/api/bounded-json";
import { generateImageByModel } from "@/lib/image-providers";
import { DEFAULT_COVER_MODEL } from "@/lib/constants";
import { ACTIVITY_COVER_PROMPT_TEMPLATE } from "@/lib/prompts/activity-cover";
import { preauthorizeCharge } from "@/lib/credits/charge";

export const runtime = "nodejs";
export const maxDuration = 120;

interface Body {
  title?: string;
  scene?: string;
  ageLabel?: string;
  theme?: string;
}

export async function POST(req: Request) {
  // Read + validate the body BEFORE preauthorizing so a malformed request
  // never holds credits.
  const parsed = await readBoundedJson<Body>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const title = body.title?.trim().slice(0, 120);
  const scene = body.scene?.trim().slice(0, 600);
  if (!title || !scene) {
    return NextResponse.json(
      { error: "title and scene are required." },
      { status: 400 },
    );
  }

  const charge = await preauthorizeCharge(req, { kind: "activity", op: "cover" });
  if (!charge.ok) return charge.response;

  try {
    const prompt = ACTIVITY_COVER_PROMPT_TEMPLATE({
      title,
      scene,
      ageLabel: body.ageLabel?.slice(0, 24),
      theme: body.theme?.slice(0, 80),
    });
    const image = await generateImageByModel(prompt, {
      aspectRatio: "3:4",
      model: DEFAULT_COVER_MODEL,
    });
    const dataUrl = `data:${image.mimeType};base64,${image.data}`;
    await charge.commit("Generated activity cover");
    return NextResponse.json({ dataUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Cover generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
