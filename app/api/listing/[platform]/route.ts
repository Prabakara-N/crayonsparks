import { NextResponse } from "next/server";
import type {
  AgeBand,
  KdpKind,
  KdpMetadataInput,
} from "@/lib/kdp-metadata";
import {
  generateEtsy,
  generateGumroad,
  generateInstagram,
  generateKdpCore,
  generatePinterest,
  generateTwitter,
} from "@/lib/kdp-metadata-hybrid";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  bookTitle?: string;
  scene?: string;
  age?: AgeBand;
  pageCount?: number;
  samplePages?: string[];
  kind?: KdpKind;
}

const PLATFORMS = [
  "kdp",
  "etsy",
  "gumroad",
  "pinterest",
  "instagram",
  "twitter",
] as const;
type Platform = (typeof PLATFORMS)[number];

function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  if (!isPlatform(platform)) {
    return NextResponse.json(
      { error: `Unknown platform: ${platform}` },
      { status: 400 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const bookTitle = body.bookTitle?.trim();
  const scene = body.scene?.trim();
  if (!bookTitle || !scene) {
    return NextResponse.json(
      { error: "bookTitle and scene are required." },
      { status: 400 },
    );
  }

  const input: KdpMetadataInput = {
    bookTitle,
    scene,
    age: body.age ?? "toddlers",
    pageCount: Math.max(5, Math.min(100, Number(body.pageCount ?? 20))),
    samplePages: Array.isArray(body.samplePages)
      ? body.samplePages.filter((s): s is string => typeof s === "string")
      : [],
    kind: body.kind === "story" ? "story" : "coloring",
  };

  try {
    let data: unknown;
    switch (platform) {
      case "kdp":
        data = await generateKdpCore(input);
        break;
      case "etsy":
        data = await generateEtsy(input);
        break;
      case "gumroad":
        data = await generateGumroad(input);
        break;
      case "pinterest":
        data = await generatePinterest(input);
        break;
      case "instagram":
        data = await generateInstagram(input);
        break;
      case "twitter":
        data = await generateTwitter(input);
        break;
    }
    return NextResponse.json({ platform, data });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : `${platform} generation failed.`;
    return NextResponse.json({ error: message, platform }, { status: 500 });
  }
}
