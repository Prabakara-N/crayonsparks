import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { PDFDocument } from "pdf-lib";
import { OPENAI_TEXT_MODEL } from "@/lib/constants";
import { COVER_BRIEF_SYSTEM } from "@/lib/prompts/cover-brief";
import { requireAuth } from "@/lib/auth/server-require-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MAX_EXCERPT_PAGES = 5;

const SELLING_SCHEMA = z
  .object({
    ageBand: z.string().max(40).optional(),
    countBadge: z.string().max(40).optional(),
    stripPhrases: z.array(z.string().max(60)).max(4).default([]),
    plaqueLines: z.array(z.string().max(80)).max(2).default([]),
  })
  .optional();

const BRIEF_SCHEMA = z.object({
  isBook: z.boolean(),
  notBookReason: z.string().max(200).optional(),
  summary: z.string().max(600).default(""),
  title: z.string().max(200).optional(),
  author: z.string().max(120).optional(),
  genre: z.string().max(80).optional(),
  audience: z.string().max(120).optional(),
  selling: SELLING_SCHEMA,
});

async function firstPagesPdf(bytes: Uint8Array): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = src.getPageCount();
  const count = Math.min(MAX_EXCERPT_PAGES, total);
  const out = await PDFDocument.create();
  const copied = await out.copyPages(
    src,
    Array.from({ length: count }, (_, i) => i),
  );
  copied.forEach((p) => out.addPage(p));
  return out.save();
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  let wantSelling = false;
  let userText = "";
  let excerpt: Uint8Array | null = null;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      wantSelling = form.get("wantSelling") === "true";
      const file = form.get("pdf");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No PDF uploaded." }, { status: 400 });
      }
      if (file.size > MAX_PDF_BYTES) {
        return NextResponse.json(
          { error: "PDF is too large (max 15 MB)." },
          { status: 400 },
        );
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      excerpt = await firstPagesPdf(bytes);
    } else {
      const body = (await req.json()) as { text?: string; wantSelling?: boolean };
      wantSelling = body.wantSelling === true;
      userText = (body.text ?? "").trim();
      if (!userText) {
        return NextResponse.json(
          { error: "Describe the book or upload a PDF." },
          { status: 400 },
        );
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Could not read the PDF — it may be corrupted or password-protected." },
      { status: 400 },
    );
  }

  const instruction = `wantSelling=${wantSelling}. ${
    excerpt
      ? "Analyze the attached book excerpt (first pages)."
      : `Book description from the user:\n\n${userText}`
  }`;

  try {
    const result = await generateObject({
      model: openai(OPENAI_TEXT_MODEL),
      system: COVER_BRIEF_SYSTEM,
      schema: BRIEF_SCHEMA,
      messages: [
        {
          role: "user",
          content: excerpt
            ? [
                { type: "text", text: instruction },
                {
                  type: "file",
                  data: excerpt,
                  mediaType: "application/pdf",
                  filename: "excerpt.pdf",
                },
              ]
            : [{ type: "text", text: instruction }],
        },
      ],
    });
    return NextResponse.json(result.object);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not analyze the book.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
