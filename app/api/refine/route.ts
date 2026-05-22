import { NextResponse } from "next/server";
import { SUPPORTED_ASPECTS, type AspectRatio } from "@/lib/gemini";
import { generateImageByModel } from "@/lib/image-providers";
import {
  DEFAULT_COVER_MODEL,
  DEFAULT_INTERIOR_MODEL,
  isImageModel,
  type ImageModel,
} from "@/lib/constants";
import { NO_AI_BORDER_RULE } from "@/lib/prompts";
import { preauthorizeCharge } from "@/lib/credits/charge";

export const runtime = "nodejs";
export const maxDuration = 60;

type RefineContext =
  | "page"
  | "cover"
  | "back-cover"
  | "story-page"
  | "story-cover"
  | "story-back-cover"
  | "custom";

interface Body {
  instruction?: string;
  sourceDataUrl?: string;
  aspectRatio?: AspectRatio;
  context?: RefineContext;
  extraReferenceDataUrls?: string[];
  model?: ImageModel;
}

function parseDataUrl(url: string): { mimeType: string; data: string } | null {
  // String-based parsing — regex on multi-MB base64 caused V8 stack overflow.
  if (!url.startsWith("data:")) return null;
  const sep = url.indexOf(";base64,");
  if (sep < 0) return null;
  const mimeType = url.slice(5, sep);
  const data = url.slice(sep + 8);
  if (!mimeType || !data) return null;
  return { mimeType, data };
}

function detectsBubbleSwapIntent(instruction: string): boolean {
  const t = instruction.toLowerCase();
  const hasBubbleWord =
    /\b(bubble|speech|dialogue|line|tail|saying|says|speaker)\b/.test(t);
  const hasSwapWord =
    /\b(swap|switch|swapped|switched|reassign|move|flip|wrong|pointing|points to|anchored)\b/.test(t);
  return hasBubbleWord && hasSwapWord;
}

const CONTEXT_GUARDRAILS: Record<RefineContext, string> = {
  page: `PAGE RULES (must remain): Pure 100% black-and-white line art, no color, no shading, no gray. All shapes enclosed by clean continuous outlines. NO text, NO numbers, NO page indicators (e.g. 1/2 or 2/3 — never add these), NO watermarks. ${NO_AI_BORDER_RULE} IF THE SOURCE IMAGE HAS A BORDER, A DECORATIVE FRAME, OR DOUBLE PARALLEL LINES ALONG THE EDGE — REMOVE THEM ENTIRELY in the output. Do NOT carry the source's border into the new image. The output is BORDERLESS line art, edge-to-edge. Keep anatomy correct.`,
  cover:
    "FRONT COVER RULES (must remain): Keep the existing book TITLE text exactly as it appears (do not change spelling, font, or color). Keep the overall composition and the main characters. Do NOT add page numbers, bar codes, version indicators, or any text other than what's already on the cover. Keep colors vibrant.",
  "back-cover":
    "BACK COVER RULES (must remain): This is a MINIMAL back cover. The composition is just two things: (1) a soft colored background that runs edge-to-edge across the entire cover, every corner included; (2) ONE elegant tagline floating freely as plain typography. The colored field is uninterrupted — every pixel of the canvas is the same colored paint, including the bottom-right corner. Keep the existing layout, color, and tagline. The tagline text is dark warm grey or near-black for readability. STRICT — do not add: illustrations, characters, animals, objects, scenes, landscapes, decorative motifs, patterns, page numbers, extra paragraphs, or new headlines.",
  "story-page":
    "STORY-BOOK INTERIOR PAGE RULES (must remain): Full-color picture-book illustration, full-bleed (the artwork reaches all four edges of the canvas). Keep the OVERALL ART STYLE of the source — same line weight, same color saturation, same lighting feel — so the edited page still looks like a sibling spread of the rest of the book. Keep all RECURRING CHARACTERS recognizable (same species, body proportions, head/face shape, color/markings, accessories) — do NOT redesign them. Speech bubbles and narration captions in the source must remain readable; if you adjust the layout, keep each bubble's tail attached to the correct speaker. NO outer border, NO frame, NO page-edge rectangle, NO page numbers, NO author/publisher text. Anatomy must stay correct (no extra limbs, no duplicate tails / wings / ears). Output a full new image, not a diff.",
  "story-cover":
    "STORY-BOOK FRONT COVER RULES (must remain): Keep the existing book TITLE text exactly as it appears (spelling, font, color, position). Keep the OVERALL ART STYLE of the source — same line weight, color saturation, lighting. Keep all RECURRING CHARACTERS recognizable. Keep selling-point overlays (subtitle pill, page-count badge, side plaque, bottom strip) intact unless the user explicitly asks to change one. Full-bleed colored background unless the user explicitly asks for a framed border. Anatomy stays correct (no extra limbs, no duplicate tails / wings). Do NOT add page numbers, barcode, ISBN, URL, social handle, watermark, or 'hand-drawn' claims. Output a full new image, not a diff.",
  "story-back-cover":
    "STORY-BOOK BACK COVER RULES (must remain): MINIMAL layout — soft colored background that runs edge-to-edge plus ONE centered italic tagline. NO illustrations, NO characters, NO scenes, NO patterns. Keep the existing color family and the existing tagline text unless the user explicitly asks to change them. The colored field is uninterrupted — every pixel of the canvas is the same color, including bottom-right corner. NO author name, NO publisher, NO ISBN, NO barcode, NO URL.",
  custom:
    "Keep the original art style and composition consistent. Output as a full new image, not a diff.",
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const instruction = (body.instruction ?? "").trim();
  if (!instruction) {
    return NextResponse.json(
      {
        error:
          "Describe what to change (e.g. 'remove the sun, add a decorative border').",
      },
      { status: 400 },
    );
  }
  if (instruction.length > 2000) {
    return NextResponse.json(
      { error: "Instruction too long (max 2000 chars)." },
      { status: 400 },
    );
  }
  const parsed = body.sourceDataUrl ? parseDataUrl(body.sourceDataUrl) : null;
  if (!parsed) {
    return NextResponse.json(
      { error: "Missing or invalid source image." },
      { status: 400 },
    );
  }

  const aspectRatio: AspectRatio =
    body.aspectRatio && SUPPORTED_ASPECTS.includes(body.aspectRatio)
      ? body.aspectRatio
      : "1:1";

  const context: RefineContext =
    body.context && body.context in CONTEXT_GUARDRAILS
      ? body.context
      : "custom";
  const guardrails = CONTEXT_GUARDRAILS[context];

  const charge = await preauthorizeCharge(req, {
    kind: context.startsWith("story-") ? "story" : "coloring",
    op: "refine",
  });
  if (!charge.ok) return charge.response;

  const extraImages: Array<{ mimeType: string; data: string }> = [];
  if (body.extraReferenceDataUrls?.length) {
    for (const url of body.extraReferenceDataUrls) {
      const ref = parseDataUrl(url);
      if (ref) extraImages.push(ref);
    }
  }

  const consistencyDirective =
    extraImages.length > 0
      ? `\n\nCROSS-PAGE REFERENCE — additional image(s) attached after the source image. The user's instruction (above) names WHICH ASPECT to match — read it carefully:\n  • If the instruction mentions characters / animals / a specific creature → match recurring character designs (same species, body proportions, head shape, color/markings, distinguishing features) from the reference.\n  • If the instruction mentions BORDER / FRAME / EDGE → IGNORE that aspect of the request. This book's borders are NOT drawn by the model; they are added in PDF post-processing as a single deterministic vector layer. Whatever border the user perceives in the reference is from that post-processing layer, not from the line art. The output stays BORDERLESS.\n  • If the instruction mentions PAGE NUMBER / NUMBERING → IGNORE that aspect — page numbers are not drawn on the line art.\n  • If the instruction mentions LAYOUT / COMPOSITION / POSITION / FRAMING → match where the subject sits on the canvas (left/center/right, top/bottom), the camera angle, and the proportion of subject vs. background.\n  • If the instruction mentions COLOR PALETTE / LIGHTING / MOOD → match the reference's hue family, saturation, and lighting direction (B&W pages are exempt — those stay pure black ink on white).\n  • If the instruction mentions STYLE / LINE WEIGHT / DETAIL DENSITY → match how lines, shading, and ornamental detail are drawn.\nIN ALL CASES: do NOT copy the reference's specific subject or scene. Generate the NEW edit described below; the reference is ONLY for the specific aspect the user named.`
      : "";

  const swapBubbleOverride = detectsBubbleSwapIntent(instruction)
    ? "\n\nSPEECH-BUBBLE REASSIGNMENT — LOAD-BEARING. The user is explicitly telling you the speech bubble is anchored to the WRONG character in the source image. You MUST visibly relocate the bubble. Concretely: (a) ERASE the bubble from its current location entirely — do not leave its tail behind. (b) REDRAW the bubble in fresh empty space NEAR THE CHARACTER NAMED BY THE USER (the new speaker). The bubble's BODY sits on the new speaker's side of the page — left half if the new speaker is on the left, right half if on the right. (c) The bubble's POINTED TAIL must visibly touch or point directly into the NEW SPEAKER's mouth — never the old speaker's mouth, never a midpoint. (d) Keep the bubble text EXACTLY the same words. (e) Do NOT also keep the old bubble — there is ONLY one bubble for that line, and it now belongs to the new speaker. If the new speaker is across the page from where the bubble used to be, the bubble moves across the page. Verify: in the OUTPUT image, can a child reading the page point unambiguously at the new speaker as the source of the line? If not, redraw."
    : "";

  const editPrompt = `Edit the provided image as follows: ${instruction}.

Keep the overall composition and identity consistent with the original. Output as a full image (not a diff).

${guardrails}${consistencyDirective}${swapBubbleOverride}`;

  try {
    const isCoverSurface = context === "cover" || context === "back-cover";
    const fallbackModel: ImageModel = isCoverSurface
      ? DEFAULT_COVER_MODEL
      : DEFAULT_INTERIOR_MODEL;
    const resolvedModel: ImageModel = isImageModel(body.model)
      ? body.model
      : fallbackModel;

    const image = await generateImageByModel(editPrompt, {
      aspectRatio,
      sourceImage: parsed,
      extraImages: extraImages.length ? extraImages : undefined,
      model: resolvedModel,
    });
    await charge.commit("Refined image");
    return NextResponse.json({
      mimeType: image.mimeType,
      data: image.data,
      dataUrl: `data:${image.mimeType};base64,${image.data}`,
      prompt: editPrompt,
      aspectRatio,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refinement failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
