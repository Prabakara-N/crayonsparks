import type { ColoringCategory } from "@/lib/prompts";
import type { ImageModel } from "@/lib/constants";
import type { GenOptions, CoverStyle, CoverBorder } from "./types";

export async function generateOne(
  subject: string,
  opts: GenOptions,
  variantSeed?: string
): Promise<{ dataUrl: string }> {
  const { categorySlug, scene, referenceDataUrl, model, ...rest } = opts;
  const isCustom = categorySlug.startsWith("custom-");
  const base = isCustom
    ? { mode: "subject", subject, ...rest, scene }
    : { mode: "subject", subject, ...rest, categorySlug };
  const payload = {
    ...base,
    ...(variantSeed ? { variantSeed } : {}),
    ...(referenceDataUrl ? { referenceDataUrl } : {}),
    ...(model ? { model } : {}),
  };
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as { dataUrl?: string; error?: string };
  if (!res.ok || !json.dataUrl) {
    throw new Error(json.error || "Generation failed");
  }
  return { dataUrl: json.dataUrl };
}

export async function generateCover(
  category: ColoringCategory,
  coverOpts: {
    style: CoverStyle;
    border: CoverBorder;
    model?: ImageModel;
    badgeStyle?: string;
  },
): Promise<{ dataUrl: string }> {
  const isCustom = category.slug.startsWith("custom-");
  const base = isCustom
    ? {
        mode: "cover",
        coverTitle: category.coverTitle,
        coverScene: category.coverScene,
      }
    : { mode: "cover", categorySlug: category.slug };
  const trimmedBadgeStyle = coverOpts.badgeStyle?.trim();
  const payload = {
    ...base,
    coverStyle: coverOpts.style,
    coverBorder: coverOpts.border,
    ...(coverOpts.model ? { model: coverOpts.model } : {}),
    ...(trimmedBadgeStyle ? { coverBadgeStyle: trimmedBadgeStyle } : {}),
  };
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as { dataUrl?: string; error?: string };
  if (!res.ok || !json.dataUrl) {
    throw new Error(json.error || "Cover generation failed");
  }
  return { dataUrl: json.dataUrl };
}
