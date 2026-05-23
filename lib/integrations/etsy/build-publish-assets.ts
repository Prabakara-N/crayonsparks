import "server-only";

import { getReadUrl } from "@/lib/storage/sign-url";
import { assembleColoringBookPdf } from "@/lib/pdf";

interface ImageVariant {
  key?: string;
}
interface ImageVariants {
  thumb?: ImageVariant;
  medium?: ImageVariant;
  full?: ImageVariant;
}

interface PageDoc {
  id: string;
  index: number;
  name?: string;
  image?: ImageVariants;
}

interface BookInput {
  title: string;
  coverTitle: string;
  mode: "qa" | "story";
  cover: ImageVariants;
  backCover?: ImageVariants;
  belongsTo?: ImageVariants;
  belongsToStyle?: "bw" | "color";
  pages: PageDoc[];
}

async function fetchAsBytes(key: string): Promise<Uint8Array> {
  const url = await getReadUrl(key, 600);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${key} (${res.status}).`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

function inferMimeFromKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

async function fetchAsDataUrl(key: string): Promise<string> {
  const bytes = await fetchAsBytes(key);
  const mime = inferMimeFromKey(key);
  const b64 = Buffer.from(bytes).toString("base64");
  return `data:${mime};base64,${b64}`;
}

function pickKey(v: ImageVariants | undefined): string | null {
  return v?.full?.key ?? v?.medium?.key ?? v?.thumb?.key ?? null;
}

export interface PublishAssets {
  coverImageBytes: Uint8Array;
  coverImageFilename: string;
  pdfBytes: Uint8Array;
  pdfFilename: string;
}

export async function buildEtsyPublishAssets(
  book: BookInput,
): Promise<PublishAssets> {
  const coverKey = pickKey(book.cover);
  if (!coverKey) {
    throw new Error("Book is missing a cover image.");
  }
  const coverImageBytes = await fetchAsBytes(coverKey);

  const orderedPages = [...book.pages].sort((a, b) => a.index - b.index);

  const pdfPageInputs = await Promise.all(
    orderedPages.map(async (p) => {
      const key = pickKey(p.image);
      if (!key) {
        throw new Error(`Page ${p.index + 1} is missing an image.`);
      }
      return {
        id: p.id,
        name: p.name ?? `Page ${p.index + 1}`,
        dataUrl: await fetchAsDataUrl(key),
      };
    }),
  );

  const coverDataUrl = await fetchAsDataUrl(coverKey);
  const backCoverKey = pickKey(book.backCover);
  const backCoverDataUrl = backCoverKey
    ? await fetchAsDataUrl(backCoverKey)
    : undefined;
  const belongsToKey = pickKey(book.belongsTo);
  const belongsToDataUrl = belongsToKey
    ? await fetchAsDataUrl(belongsToKey)
    : undefined;

  const pdfBytes = await assembleColoringBookPdf({
    title: book.coverTitle || book.title,
    category: book.mode === "story" ? "story" : "coloring",
    pages: pdfPageInputs,
    cover: { dataUrl: coverDataUrl },
    backCover: backCoverDataUrl ? { dataUrl: backCoverDataUrl } : undefined,
    belongsTo:
      belongsToDataUrl && book.belongsToStyle
        ? { dataUrl: belongsToDataUrl, style: book.belongsToStyle }
        : undefined,
    includeTitlePage: false,
    includeBlankPages: false,
  });

  const safeTitle = (book.coverTitle || book.title || "coloring-book")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return {
    coverImageBytes,
    coverImageFilename: `${safeTitle}-cover.${inferMimeFromKey(coverKey) === "image/png" ? "png" : "jpg"}`,
    pdfBytes,
    pdfFilename: `${safeTitle}.pdf`,
  };
}
