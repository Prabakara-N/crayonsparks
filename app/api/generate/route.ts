import { NextResponse } from "next/server";
import sharp from "sharp";
import { readBoundedJson } from "@/lib/api/bounded-json";
import { SUPPORTED_ASPECTS, type AspectRatio } from "@/lib/gemini";
import { generateImageByModel } from "@/lib/image-providers";
import {
  DEFAULT_COVER_MODEL,
  DEFAULT_INTERIOR_MODEL,
  isImageModel,
  type ImageModel,
} from "@/lib/constants";
import {
  MASTER_PROMPT_SYSTEM,
  MASTER_PROMPT_USER,
  REFERENCE_LED_PROMPT_TEMPLATE,
  COLOR_COVER_PROMPT_TEMPLATE,
  BACK_COVER_PROMPT_TEMPLATE,
  BELONGS_TO_PROMPT_TEMPLATE,
  THE_END_PROMPT_TEMPLATE,
  CONSISTENCY_ANCHOR_PROMPT,
  findCategory,
} from "@/lib/prompts";
import { rateColoringPage, type QualityScore } from "@/lib/quality-gate";
import { extractStyleFromReference } from "@/lib/style-extractor";
import { parseDataUrl, type Body } from "./request";
import { preauthorizeCharge } from "@/lib/credits/charge";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const parsed = await readBoundedJson<Body>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const mode = body.mode ?? "subject";
  const category = body.categorySlug ? findCategory(body.categorySlug) : null;

  // Credit gate — every mode requires sign-in and costs credits.
  // "raw" (playground freeform single image) is the cheap "single" op.
  let charge: Awaited<ReturnType<typeof preauthorizeCharge>>;
  if (mode === "raw") {
    charge = await preauthorizeCharge(req, { kind: "coloring", op: "single" });
  } else {
    const kind =
      mode === "the-end"
        ? "story"
        : body.bookKind === "activity"
          ? "activity"
          : "coloring";
    const op = mode === "cover" || mode === "back-cover" ? "cover" : "page";
    charge = await preauthorizeCharge(req, { kind, op });
  }
  if (!charge.ok) return charge.response;

  let text: string;
  let aspectRatio: AspectRatio;
  let systemInstruction: string | undefined;

  if (mode === "cover") {
    const title = body.coverTitle?.trim() || category?.coverTitle;
    const scene = body.coverScene?.trim() || category?.coverScene;
    if (!title || !scene) {
      return NextResponse.json(
        { error: "Cover mode requires a category or (coverTitle + coverScene)." },
        { status: 400 }
      );
    }
    text = COLOR_COVER_PROMPT_TEMPLATE({
      title,
      scene,
      style: body.coverStyle,
      border: body.coverBorder,
      pageCount: body.pageCount,
      ageLabel: body.ageLabel,
      bottomStripPhrases: body.bottomStripPhrases,
      sidePlaqueLines: body.sidePlaqueLines,
      coverBadgeStyle: body.coverBadgeStyle,
      brandStrapline: body.brandStrapline,
      productNoun: body.bookKind === "activity" ? "ACTIVITY BOOK" : undefined,
    });
    aspectRatio = "3:4";
  } else if (mode === "belongs-to") {
    const title = body.coverTitle?.trim() || category?.coverTitle || "Coloring Book";
    const characters = body.belongsToCharacters?.trim();
    if (!characters) {
      return NextResponse.json(
        { error: "Belongs-to mode requires belongsToCharacters." },
        { status: 400 },
      );
    }
    text = BELONGS_TO_PROMPT_TEMPLATE({
      bookTitle: title,
      characters,
      style: body.belongsToStyle ?? "bw",
      characterLock: body.characterLock?.trim(),
    });
    aspectRatio = "3:4";
  } else if (mode === "the-end") {
    const title =
      body.coverTitle?.trim() || category?.coverTitle || "Story Book";
    const message = body.theEndMessage?.trim();
    if (!message) {
      return NextResponse.json(
        { error: "The-end mode requires theEndMessage." },
        { status: 400 },
      );
    }
    const storyTypeMoodMap: Record<string, string> = {
      bedtime: "cozy bedtime — calm sunset / starry pastel sky, soft rounded serif lettering, wind-down quiet mood",
      fairytale: "classic fairytale — warm storybook palette, ornamental hand-painted serif lettering, wonder + happy-ending energy",
      fantasy: "magical fantasy — starry / twilight palette with one glow accent, sparkly whimsical lettering",
      adventure: "warm adventure — energetic sunset palette, chunky bold display lettering, hopeful triumph energy",
      moral: "gentle moral fable — muted woodland palette, elegant hand-lettered serif, calm reflective mood",
      mystery: "soft kid-friendly mystery — warm puzzle / clue palette, neat playful display lettering, satisfied solved-it energy",
      comic: "funny comic — bright cartoon palette, bold cartoon block lettering with a playful tilt, smiling silly energy",
      fiction: "warm everyday fiction — soft natural palette, friendly hand-lettered serif, cozy emotional close",
      "non-fiction": "calm educational close — clean natural palette, neat readable serif lettering, satisfied learned-something energy",
    };
    const storyType = body.theEndStoryType?.trim().toLowerCase();
    const storyMood = storyType ? storyTypeMoodMap[storyType] : undefined;
    text = THE_END_PROMPT_TEMPLATE({
      bookTitle: title,
      message,
      paletteLine: body.theEndPaletteLine?.trim() || undefined,
      storyMood,
      coverStyle: body.coverStyle,
      coverBorder: body.coverBorder,
    });
    aspectRatio = "2:3";
  } else if (mode === "back-cover") {
    const title = body.coverTitle?.trim() || category?.coverTitle;
    const scene = body.coverScene?.trim() || category?.coverScene;
    const description =
      body.backCoverDescription?.trim() ||
      category?.kdp?.description ||
      "A fun coloring book with original illustrations.";
    if (!title || !scene) {
      return NextResponse.json(
        { error: "Back-cover mode requires a category or (coverTitle + coverScene)." },
        { status: 400 },
      );
    }
    text = BACK_COVER_PROMPT_TEMPLATE({
      title,
      scene,
      description,
      style: body.coverStyle,
      border: body.coverBorder,
      forceColor: body.backCoverColor?.trim() || undefined,
      forceTagline: body.backCoverTagline?.trim() || undefined,
    });
    aspectRatio = "3:4";
  } else if (mode === "raw") {
    const raw = (body.prompt ?? "").trim();
    if (!raw) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }
    text = raw;
    aspectRatio =
      body.aspectRatio && SUPPORTED_ASPECTS.includes(body.aspectRatio)
        ? body.aspectRatio
        : "1:1";
  } else {
    const subject = (body.subject ?? "").trim();
    if (!subject) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }
    systemInstruction = MASTER_PROMPT_SYSTEM;
    text = MASTER_PROMPT_USER(subject, {
      age: body.age,
      detail: body.detail,
      background: body.background,
      scene: body.scene?.trim() || category?.scene,
      variantSeed: body.variantSeed,
      characterLock: body.characterLock?.trim(),
    });
    aspectRatio =
      body.aspectRatio && SUPPORTED_ASPECTS.includes(body.aspectRatio)
        ? body.aspectRatio
        : "3:4";
  }

  // Gemini 2.5 Flash Image easily handles 32k+ tokens. Our wrapped master
  // prompt + story-mode scene descriptors + character lock (up to 5
  // characters × ~400 chars) + cover-as-anchor chain directive + border
  // verifier retry suffixes can run 12-16k chars on heavy retries.
  // 20000 keeps headroom while still rejecting pathological inputs.
  if (text.length > 35000) {
    return NextResponse.json({ error: "Prompt too long (max 35000 chars)." }, { status: 400 });
  }

  // Two-step reference flow:
  //   1. OpenAI vision extracts a concise art-style description from
  //      the reference image (no raw image sent to Gemini).
  //   2. The style description is appended to the prompt so Gemini sees
  //      "imitate THIS STYLE" as text only — no image-edit confusion.
  // For "raw" mode (single-image playground freeform) we still pass the
  // raw image because the user wants direct image editing there.
  let referenceImage: { mimeType: string; data: string } | undefined;
  if (body.referenceDataUrl) {
    const parsed = parseDataUrl(body.referenceDataUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid reference image data URL." },
        { status: 400 },
      );
    }

    if (mode === "raw") {
      // Playground mode — keep raw image-edit behavior.
      referenceImage = parsed;
      text = `Reference image is provided as visual inspiration. Use its style/composition. Generate following: ${text}`;
    } else if (mode === "subject") {
      // Coloring page with reference: use the REFERENCE-LED template
      // (slim rules + style description) AND send the raw image as visual
      // cue. This avoids the master prompt's strict subject-size /
      // background-minimal rules contradicting what the reference shows.
      try {
        const { description } = await extractStyleFromReference(
          body.referenceDataUrl,
          "page",
        );
        const subject = body.subject?.trim() ?? "";
        text = REFERENCE_LED_PROMPT_TEMPLATE(subject, description, {
          age: body.age,
          detail: body.detail,
        });
        systemInstruction = undefined;
        referenceImage = parsed;
      } catch {
        // Style extraction failed — fall back to MASTER prompt without ref.
        text = `(Note: a reference image was provided but could not be analyzed.)\n${text}`;
      }
    } else if (mode === "back-cover") {
      // Back-cover: chain BOTH the text style description AND the actual
      // front-cover image. Text alone (the prior flow) lost color precision
      // — the vision model might say "soft pastel" and Gemini would default to mint
      // green even when the front was baby pink. Sending the image lets
      // Gemini visually anchor the dominant color, while the text guides
      // the overall composition rules (two-layer band, tagline placement).
      try {
        const { description } = await extractStyleFromReference(
          body.referenceDataUrl,
          "cover",
        );
        text = `FRONT-COVER COLOR ANCHOR — A reference image of the FRONT COVER is attached. The back cover MUST use the SAME dominant background color as the front cover (study the attached image to identify it). Style description from vision analysis: "${description}". Apply that style — but the BACK is minimal layout (no characters, no scene, just colored background + one centered tagline), NOT a copy of the front. Use the front cover ONLY for color matching, not for content.\n\n${text}`;
        referenceImage = parsed;
      } catch {
        // Style extraction failed — still send the image so color match
        // works even without the text description.
        text = `FRONT-COVER COLOR ANCHOR — A reference image of the front cover is attached. Match its dominant background color exactly on the back cover.\n\n${text}`;
        referenceImage = parsed;
      }
    } else {
      // Front cover / other surfaces with a user-uploaded style reference.
      // Keep text-only — sending the image would put Gemini in image-edit
      // mode and copy elements rather than just adopting the style.
      try {
        const { description } = await extractStyleFromReference(
          body.referenceDataUrl,
          "cover",
        );
        text = `ART STYLE TO IMITATE — READ FIRST AND OBEY: Generate the new illustration in this art style: "${description}". This style description was extracted from a reference image the user uploaded. Apply this style to a COMPLETELY NEW illustration of the subject described below. DO NOT copy any specific elements from the reference; only adopt its visual style.\n\n${text}`;
      } catch {
        text = `(Note: a reference image was provided but could not be analyzed.)\n${text}`;
      }
    }
  }

  // STYLE-CHAIN reference: a previously generated page from the same book.
  // Sent as an additional image so Gemini can match recurring characters,
  // line weight, and overall style from page to page. We do NOT replace the
  // master prompt — full B&W / no-border / size rules stay in effect.
  //
  // Plus: the cover image is sent as a SECONDARY anchor (when provided)
  // so EVERY interior page sees the cover's character design, not just
  // page 1. Fixes the drift where the cover's character look gets
  // dropped after the chain ref is promoted to the first interior page.
  const chainImages: Array<{ mimeType: string; data: string }> = [];
  let chainHasInteriorPage = false;
  let chainHasCover = false;
  if (body.chainReferenceDataUrl && mode !== "raw") {
    const parsedChain = parseDataUrl(body.chainReferenceDataUrl);
    if (parsedChain) {
      chainImages.push(parsedChain);
      chainHasInteriorPage = true;
    }
  }
  if (
    body.coverReferenceDataUrl &&
    body.coverReferenceDataUrl !== body.chainReferenceDataUrl &&
    mode !== "raw" &&
    mode !== "cover" &&
    mode !== "back-cover"
  ) {
    const parsedCover = parseDataUrl(body.coverReferenceDataUrl);
    if (parsedCover) {
      chainImages.push(parsedCover);
      chainHasCover = true;
    }
  }
  if (chainImages.length > 0) {
    const refLabel =
      chainHasInteriorPage && chainHasCover
        ? "TWO images from THE SAME BOOK are attached as visual references — image 1 is a previously generated INTERIOR PAGE, image 2 is the COVER"
        : chainHasCover
          ? "An image from THE SAME BOOK is attached as a visual reference (the COVER)"
          : "An image from THE SAME BOOK is attached as a visual reference (a previously generated INTERIOR PAGE)";
    text = `${CONSISTENCY_ANCHOR_PROMPT(refLabel)}\n\n${text}`;
  }

  try {
    // Cover surfaces (front, back, belongs-to is technically interior but it
    // sits on the inside cover and uses the cover-quality model so character
    // cameos match the front-cover style) → cover default.
    // Everything else → interior default.
    const isCoverSurface =
      mode === "cover" ||
      mode === "back-cover" ||
      mode === "belongs-to" ||
      mode === "the-end";
    const fallbackModel: ImageModel = isCoverSurface
      ? DEFAULT_COVER_MODEL
      : DEFAULT_INTERIOR_MODEL;

    // Trust-but-verify: the body type system can't enforce the union at the
    // wire boundary, so reject anything outside the allowlist before it
    // reaches the dispatcher (avoids paying for a typo'd model id).
    const resolvedModel: ImageModel = isImageModel(body.model)
      ? body.model
      : fallbackModel;

    const image = await generateImageByModel(text, {
      aspectRatio,
      sourceImage: referenceImage,
      extraImages: chainImages.length ? chainImages : undefined,
      systemInstruction,
      model: resolvedModel,
    });

    let outMime = image.mimeType;
    let outData = image.data;
    // Gemini sometimes ignores the 3:4 hint for the nameplate and returns a
    // square — pad it to a tall 3:4 page so it matches the KDP interior size.
    if (mode === "belongs-to") {
      try {
        const buf = Buffer.from(image.data, "base64");
        const meta = await sharp(buf).metadata();
        const w = meta.width ?? 0;
        const h = meta.height ?? 0;
        if (w > 0 && h > 0 && Math.abs(w / h - 0.75) > 0.03) {
          const targetH = Math.round((w * 4) / 3);
          const padded = await sharp(buf)
            .resize(w, targetH, { fit: "contain", background: "#ffffff" })
            .png()
            .toBuffer();
          outData = padded.toString("base64");
          outMime = "image/png";
        }
      } catch {
        // keep the original image on any normalisation failure
      }
    }
    const dataUrl = `data:${outMime};base64,${outData}`;

    let quality: QualityScore | null = null;
    const wantsGate =
      body.qualityGate !== false &&
      mode !== "raw" &&
      !!process.env.OPENAI_API_KEY;
    if (wantsGate) {
      try {
        // Treat covers + COLOR belongs-to as "cover" (relaxed B&W rules).
        // BW belongs-to is rated as a page (must stay pure black ink).
        const isCover =
          mode === "cover" ||
          mode === "back-cover" ||
          mode === "the-end" ||
          (mode === "belongs-to" && body.belongsToStyle === "color");
        const expected =
          mode === "belongs-to"
            ? `'This Book Belongs To' nameplate page with a decorative banner, a blank line for the child's name, and two corner character cameos drawn from: ${body.belongsToCharacters ?? "book characters"}`
            : mode === "the-end"
              ? `Final 'The End' page with the locked main characters waving at the reader and a speech bubble containing: "${body.theEndMessage ?? ""}"`
              : isCover
                ? body.coverScene?.trim() || category?.coverScene || "book cover"
                : body.subject?.trim() || "coloring page subject";
        quality = await rateColoringPage({
          imageDataUrl: dataUrl,
          expectedSubject: expected,
          isCover,
        });
      } catch {
        // Don't fail the request if rating fails — just omit it.
        quality = null;
      }
    }

    if (charge.ok) {
      await charge.commit(
        mode === "raw" ? "Generated single image" : `Generated ${mode}`,
      );
    }

    return NextResponse.json({
      mimeType: outMime,
      data: outData,
      dataUrl,
      prompt: text,
      aspectRatio,
      mode,
      quality,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
