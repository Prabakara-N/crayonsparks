/**
 * Story-book PDF assembly endpoint (Phase 1).
 *
 * Body:
 *   {
 *     title?: string,
 *     pages: [{ id, name, dataUrl }, ...],
 *     cover?: { dataUrl },
 *     backCover?: { dataUrl },
 *     trimWidthInches?: number,   // default 6
 *     trimHeightInches?: number,  // default 9
 *   }
 *
 * Returns: application/pdf bytes (Content-Disposition attachment).
 */

import { NextResponse } from "next/server";
import {
  assembleStoryBookPdf,
  type StoryPageInput,
} from "@/lib/story-book-pdf";
import { compositeBubblesOnImage } from "@/lib/page-bubble-composite";
import type { StoryBubble } from "@/lib/story-bubble-seed";

export const runtime = "nodejs";
export const maxDuration = 300;

interface PageBody extends StoryPageInput {
  bubbles?: StoryBubble[];
}

interface Body {
  title?: string;
  pages?: PageBody[];
  cover?: { dataUrl: string };
  backCover?: { dataUrl: string };
  trimWidthInches?: number;
  trimHeightInches?: number;
}

function isPage(value: unknown): value is PageBody {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as PageBody).id === "string" &&
    typeof (value as PageBody).name === "string" &&
    typeof (value as PageBody).dataUrl === "string" &&
    (value as PageBody).dataUrl.startsWith("data:")
  );
}

async function bakePageBubbles(page: PageBody): Promise<StoryPageInput> {
  if (!page.bubbles || page.bubbles.length === 0) {
    return { id: page.id, name: page.name, dataUrl: page.dataUrl };
  }
  const sep = page.dataUrl.indexOf(";base64,");
  if (sep < 0) return { id: page.id, name: page.name, dataUrl: page.dataUrl };
  const base64 = page.dataUrl.slice(sep + 8);
  const result = await compositeBubblesOnImage({
    imageBase64: base64,
    bubbles: page.bubbles,
  });
  return {
    id: page.id,
    name: page.name,
    dataUrl: `data:${result.mimeType};base64,${result.base64}`,
  };
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const pages = Array.isArray(body.pages) ? body.pages.filter(isPage) : [];
  if (pages.length === 0) {
    return NextResponse.json(
      { error: "At least one page with a data URL is required." },
      { status: 400 },
    );
  }

  try {
    const bakedPages = await Promise.all(pages.map(bakePageBubbles));
    const bytes = await assembleStoryBookPdf({
      title: body.title,
      pages: bakedPages,
      cover: body.cover,
      backCover: body.backCover,
      trimWidthInches: body.trimWidthInches,
      trimHeightInches: body.trimHeightInches,
    });
    const filename = (body.title ?? "crayonsparks-story-book")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Story book PDF assembly failed",
      },
      { status: 500 },
    );
  }
}
