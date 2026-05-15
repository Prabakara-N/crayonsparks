/**
 * Hybrid listing-metadata generator. Perplexity does live-Amazon research
 * (keywords + categories) once, then per-platform OpenAI copy calls run in
 * parallel. Each platform export is callable on its own so the UI can fire
 * 6 fetches and update each tab as it resolves.
 */

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { callPerplexity, extractJsonFromPerplexity } from "./perplexity";
import type {
  EtsyMetadata,
  GumroadMetadata,
  InstagramPost,
  KdpCore,
  KdpMetadata,
  KdpMetadataInput,
  PinterestPin,
  TwitterPost,
} from "./kdp-metadata";
import { OPENAI_COPY_MODEL } from "./constants";

const OPENAI_MODEL = OPENAI_COPY_MODEL;

const AGE_DESCRIPTORS: Record<KdpMetadataInput["age"], string> = {
  toddlers: "toddlers and preschoolers ages 3-6",
  kids: "kids ages 6-10",
  tweens: "tweens ages 10-14",
};

// ---------- Shared Perplexity research ----------

export interface PerplexityResearch {
  keywords: string[];
  categories: string[];
  competitorTitles?: string[];
  notes?: string;
}

function buildResearchUserPrompt(input: KdpMetadataInput): string {
  const isStory = input.kind === "story";
  const productLabel = isStory
    ? "full-color children's picture book (read-aloud / bedtime story)"
    : "coloring book";
  const exampleCategoryHint = isStory
    ? `e.g. "Books > Children's Books > Animals > Stories", "Books > Children's Books > Fairy Tales, Folk Tales & Myths > Fables", "Books > Children's Books > Bedtime & Dreaming"`
    : `e.g. "Books > Children's Books > Activities, Crafts & Games > Activity Books"`;
  const sceneOrPlot = isStory
    ? `Story / cover scene: ${input.scene}`
    : `World/scene: ${input.scene}`;
  const niche = isStory
    ? "picture-book / read-aloud story-book"
    : "coloring-book";

  return `Research a ${productLabel} for ${AGE_DESCRIPTORS[input.age]} titled: "${input.bookTitle}". Page count: ${input.pageCount}.
${sceneOrPlot}

Find on AMAZON.COM right now:
1. The 7 best-converting backend keywords for this ${niche} niche — phrases buyers actually search for. Each ≤50 characters, no commas, no quotation marks.${
    isStory
      ? " Examples to consider: \"read aloud picture book\", \"bedtime story toddler\", \"fable book ages 3-5\", \"classic story for kids\"."
      : ""
  }
2. The 2 most-relevant Amazon KDP browse-category paths (full path, ${exampleCategoryHint}). Verify these categories EXIST in Amazon's current taxonomy.
3. (Optional) 2-3 examples of real top-selling competitor book titles in this niche.

Return JSON ONLY in this exact shape:
{
  "keywords": ["7 keywords here", "...", "...", "...", "...", "...", "..."],
  "categories": ["Books > ... > ...", "Books > ... > ..."],
  "competitorTitles": ["Top Seller Title 1", "Top Seller Title 2"],
  "notes": "one short line about market trends or anything notable"
}`;
}

export async function researchWithPerplexity(
  input: KdpMetadataInput,
): Promise<PerplexityResearch> {
  const system = `You are an Amazon KDP listing research expert. Use live web search to find ACCURATE, CURRENT data for the book described. Return ONLY a JSON object — no prose, no markdown fences, no citations.`;

  const user = buildResearchUserPrompt(input);

  const res = await callPerplexity({ system, user, temperature: 0.2 });
  const obj = extractJsonFromPerplexity(res.text) as Partial<PerplexityResearch>;

  const keywords = Array.isArray(obj.keywords)
    ? obj.keywords
        .filter((k): k is string => typeof k === "string")
        .map((k) => k.trim().slice(0, 50))
        .slice(0, 7)
    : [];
  while (keywords.length < 7) keywords.push("");

  const categories = Array.isArray(obj.categories)
    ? obj.categories
        .filter((c): c is string => typeof c === "string")
        .map((c) => c.trim())
        .slice(0, 2)
    : [];
  while (categories.length < 2) categories.push("");

  return {
    keywords,
    categories,
    competitorTitles: Array.isArray(obj.competitorTitles)
      ? obj.competitorTitles.filter((t): t is string => typeof t === "string")
      : undefined,
    notes: typeof obj.notes === "string" ? obj.notes : undefined,
  };
}

function emptyResearch(): PerplexityResearch {
  return { keywords: Array(7).fill(""), categories: ["", ""] };
}

async function safeResearch(
  input: KdpMetadataInput,
): Promise<{ research: PerplexityResearch; researchError?: string }> {
  const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
  if (!hasPerplexity) {
    return {
      research: emptyResearch(),
      researchError:
        "PERPLEXITY_API_KEY not set — using OpenAI to invent keywords (less accurate than live Amazon data).",
    };
  }
  try {
    return { research: await researchWithPerplexity(input) };
  } catch (e) {
    return {
      research: emptyResearch(),
      researchError: e instanceof Error ? e.message : "Research failed",
    };
  }
}

function requireOpenAi(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is required for listing metadata. Add it to .env.local.",
    );
  }
}

// ---------- Shared book brief (used by every per-platform prompt) ----------

function buildBookBrief(input: KdpMetadataInput): string {
  const isStory = input.kind === "story";
  const productHeading = isStory
    ? "full-color children's picture book"
    : "coloring book";
  const sceneLabel = isStory ? "Story scene / plot" : "World/scene";
  const samplesLabel = isStory ? "Sample scenes" : "Sample interior pages";
  return `BOOK
- Type: ${productHeading} (printable PDF digital download)
- Theme/working title: "${input.bookTitle}"
- Audience: ${AGE_DESCRIPTORS[input.age]}
- Pages: ${input.pageCount}
- ${sceneLabel}: ${input.scene}
- ${samplesLabel}: ${input.samplePages.slice(0, 6).join("; ")}`;
}

const COMMON_AVOID = `Avoid: copyrighted characters (Disney, Marvel, Pokemon), trademarked phrases, made-up awards.`;

// ---------- KDP core ----------

const KDP_SCHEMA = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(100),
  descriptionHtml: z.string().min(1),
  descriptionText: z.string().min(1),
  suggestedPriceUsd: z.string(),
});

export async function generateKdpCore(
  input: KdpMetadataInput,
): Promise<KdpCore> {
  requireOpenAi();
  const { research, researchError } = await safeResearch(input);

  const isStory = input.kind === "story";
  const titleFormat = isStory
    ? `Format: "[Story Name]: A [Audience] Picture Book for Read-Aloud" or "[Story Name] — Illustrated Story Book for [Audience]". Include 2-3 of the verified keywords naturally. Never call it a coloring book.`
    : `Format: "[Theme] Coloring Book for [Audience]: [Page Count] [Hook] | [Differentiator]". Include 2-3 of the verified keywords naturally.`;
  const priceGuidance = isStory
    ? `e.g. "7.99" for short toddler picture books (8-16 pages), "9.99" for standard 20-30 page picture books, "12.99" for premium hardcover-feel editions.`
    : `e.g. "6.99" for 20-30 pages, "8.99" for 40+ pages, "9.99" for premium tween editions.`;
  const descriptionGuidance = isStory
    ? `descriptionHtml: 180-350 words. Open with the story hook, then <ul><li> bullets of WHAT THE PARENT GETS (4-6). Close with a soft parent-facing sell. Use <p>, <strong>, <ul>, <li> tags only. No markdown.`
    : `descriptionHtml: 200-400 words, opens with audience hook, then <ul><li> bullets of features (4-6), closes with soft sell. Use <p>, <strong>, <ul>, <li> tags only. No markdown.`;

  const user = `Write SEO-optimized Amazon KDP listing copy.

${buildBookBrief(input)}

VERIFIED HIGH-INTENT KEYWORDS (use these in the title and description; researched on live Amazon):
${research.keywords.map((k, i) => `  ${i + 1}. ${k}`).join("\n")}

${research.competitorTitles?.length ? `TOP COMPETITOR TITLES (for tone/structure only, DO NOT copy):\n${research.competitorTitles.map((t) => `  - ${t}`).join("\n")}\n` : ""}WRITE
- title: ≤200 chars. ${titleFormat}
- subtitle: optional, 5-10 words, complements title; empty string if not needed.
- ${descriptionGuidance}
- descriptionText: same description as plain text (no HTML).
- suggestedPriceUsd: ${priceGuidance}

${COMMON_AVOID}${
    isStory
      ? " Never claim the art is hand-drawn, hand-painted, hand-illustrated, handmade, or original artwork — these are AI-illustrated picture books."
      : ""
  }`;

  const result = await generateObject({
    model: openai(OPENAI_MODEL),
    system: `You are an Amazon KDP SEO copywriter. Output strictly via the schema.`,
    schema: KDP_SCHEMA,
    prompt: user,
  });

  return {
    title: result.object.title,
    subtitle: result.object.subtitle,
    descriptionHtml: result.object.descriptionHtml,
    descriptionText: result.object.descriptionText,
    suggestedPriceUsd: result.object.suggestedPriceUsd,
    keywords: research.keywords,
    categories: research.categories,
    notes: [research.notes, researchError].filter(Boolean).join(" · ") || undefined,
  };
}

// ---------- Etsy ----------

const ETSY_SCHEMA = z.object({
  title: z.string().min(1).max(140),
  description: z.string().min(1),
  tags: z.array(z.string().max(20)).length(13),
});

export async function generateEtsy(
  input: KdpMetadataInput,
): Promise<EtsyMetadata> {
  requireOpenAi();
  const user = `Write an ETSY listing for this printable PDF book. Etsy buyers search for "printable", "digital download", "PDF" — front-load those signals.

${buildBookBrief(input)}

WRITE
- title: ≤140 chars. Front-load 2-3 strong keywords (Etsy weights first ~40 chars heaviest). Include "Printable" or "Digital Download". No emoji, no ALL CAPS.
- description: 250-500 words plain text (no HTML, no markdown). Open with what the buyer downloads ("Instant download: 1 PDF, ${input.pageCount} pages, print at home on US Letter or A4"). Use short paragraphs separated by blank lines. End with a printing/license line.
- tags: EXACTLY 13 tags, each ≤20 chars. Multi-word phrases preferred ("kids coloring book" beats "kids"). Mix broad + niche. No commas, no quotation marks, no hashtags.

${COMMON_AVOID}`;

  const result = await generateObject({
    model: openai(OPENAI_MODEL),
    system: `You are an Etsy listing copywriter. Output strictly via the schema.`,
    schema: ETSY_SCHEMA,
    prompt: user,
  });

  return {
    title: result.object.title.slice(0, 140),
    description: result.object.description,
    tags: result.object.tags.map((t) => t.slice(0, 20)),
  };
}

// ---------- Gumroad ----------

const GUMROAD_SCHEMA = z.object({
  name: z.string().min(1).max(140),
  summary: z.string().min(1).max(280),
  description: z.string().min(1),
  additionalInfo: z
    .array(
      z.object({
        label: z.string().min(1).max(30),
        value: z.string().min(1).max(80),
      }),
    )
    .min(5)
    .max(7),
  tags: z.array(z.string().max(30)).min(5).max(10),
  category: z.string().min(1).max(60),
});

export async function generateGumroad(
  input: KdpMetadataInput,
): Promise<GumroadMetadata> {
  requireOpenAi();
  const user = `Write a GUMROAD listing for this printable PDF book. Gumroad sells digital products; the description uses emoji section headers and short paragraphs, not HTML.

${buildBookBrief(input)}

WRITE
- name: short product name, ≤140 chars. Buyer-friendly headline, NOT a long SEO title.
- summary: ONE sentence, ≤280 chars, benefit at a glance. EXAMPLE shape (illustrative only, do not literally use these words unless they match this book): "Fun and beginner-friendly ABC tracing workbook for toddlers and preschoolers featuring A–Z letter practice, handwriting activities, and printable learning pages in an instant PDF download."
- description: multi-paragraph emoji-decorated description. Use this EXACT structure (illustrative example below — write fresh prose tailored to THIS book):
    Paragraph 1: One-sentence opener describing what the book is and who it's for (2-3 sentences max). Plain prose, no emoji here.
    Paragraph 2 starts with "✨ What's Included:" then a line break, then 4-6 short feature lines, each on its own line. NO bullet characters.
    Paragraph 3 starts with "Perfect for:" then a line break, then 4-6 short usage lines, each on its own line. NO bullet characters.
    Paragraph 4: 1-2 sentences about who benefits (parents, teachers, homeschoolers, age band).
    Final paragraph: three short standalone lines:
      "📥 Instant Download"
      "🖨 Print at home anytime"
      "❌ No physical product will be shipped"
   Use \\n for paragraph breaks. Plain text only, no HTML, no markdown bold/italic.
- additionalInfo: 5-7 key/value rows shown as "Label — Value" lines. EXAMPLES of label types (illustrative only): "Pages", "Format", "Age Range", "Language", "Usage", "File Size", "Print Size". Pick 5-7 that fit THIS book. Values are short (≤80 chars), e.g. "${input.pageCount} Printable Pages", "PDF Digital Download".
- tags: 5-10 short Gumroad tags (each ≤30 chars). Lowercase, multi-word allowed, no commas, no hashtag prefix.
- category: ONE Gumroad top-level category, output verbatim from this list: "Education", "Drawing & Painting", "Comics & Graphic Novels", "Fiction Books", "Audio", "Self Improvement", "Crafts & DIY", "Design", "Other". Most coloring/picture books fit "Education" or "Drawing & Painting".

${COMMON_AVOID}`;

  const result = await generateObject({
    model: openai(OPENAI_MODEL),
    system: `You are a Gumroad listing copywriter. Output strictly via the schema.`,
    schema: GUMROAD_SCHEMA,
    prompt: user,
  });

  return {
    name: result.object.name.slice(0, 140),
    summary: result.object.summary.slice(0, 280),
    description: result.object.description,
    additionalInfo: result.object.additionalInfo.map((row) => ({
      label: row.label.slice(0, 30),
      value: row.value.slice(0, 80),
    })),
    tags: result.object.tags.map((t) => t.replace(/^#/, "").slice(0, 30)),
    category: result.object.category,
  };
}

// ---------- Pinterest ----------

const PINTEREST_SCHEMA = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(800),
});

export async function generatePinterest(
  input: KdpMetadataInput,
): Promise<PinterestPin> {
  requireOpenAi();
  const user = `Write a PINTEREST PIN for this printable PDF book.

${buildBookBrief(input)}

WRITE
- title: ≤100 chars, keyword-rich, clickable. Include 1-2 strong keywords plus a benefit ("Printable", "for Kids", "Instant Download").
- description: ≤800 chars. 2-4 short paragraphs. First line is a hook, then describe what's inside, who it's for, end with a soft CTA ("Click to download"). End with 3-5 inline hashtags (#example) after a blank line.

${COMMON_AVOID}`;

  const result = await generateObject({
    model: openai(OPENAI_MODEL),
    system: `You are a Pinterest pin copywriter. Output strictly via the schema.`,
    schema: PINTEREST_SCHEMA,
    prompt: user,
  });

  return {
    title: result.object.title.slice(0, 100),
    description: result.object.description.slice(0, 800),
  };
}

// ---------- Instagram ----------

const INSTAGRAM_SCHEMA = z.object({
  caption: z.string().min(1).max(2200),
  hashtags: z.array(z.string()).length(5),
});

export async function generateInstagram(
  input: KdpMetadataInput,
): Promise<InstagramPost> {
  requireOpenAi();
  const user = `Write an INSTAGRAM LAUNCH POST for this printable PDF book.

${buildBookBrief(input)}

WRITE
- caption: 80-180 words. Hook in the first line (a question or vivid image), then 2-3 short paragraphs, then a soft CTA ("Tap the link in bio to grab a copy"). No hashtags in the caption itself.
- hashtags: EXACTLY 5 hashtags, each starting with #, no spaces, mixed reach (1 broad + 2 mid + 2 niche). No banned tags.

${COMMON_AVOID}`;

  const result = await generateObject({
    model: openai(OPENAI_MODEL),
    system: `You are an Instagram copywriter for kids/parenting brands. Output strictly via the schema.`,
    schema: INSTAGRAM_SCHEMA,
    prompt: user,
  });

  return {
    caption: result.object.caption,
    hashtags: result.object.hashtags.map((h) =>
      h.startsWith("#") ? h : `#${h}`,
    ),
  };
}

// ---------- Twitter / X ----------

const TWITTER_SCHEMA = z.object({
  caption: z.string().min(1).max(280),
});

export async function generateTwitter(
  input: KdpMetadataInput,
): Promise<TwitterPost> {
  requireOpenAi();
  const user = `Write a TWITTER / X LAUNCH POST for this printable PDF book.

${buildBookBrief(input)}

WRITE
- caption: ≤280 chars TOTAL including hashtags. NO link (the user adds their own). Format: "[Hook sentence] [Benefit sentence] [2-3 hashtags at end]". Tight, punchy, scroll-stopping. Hashtags lowercase or CamelCase, no spaces.

${COMMON_AVOID}`;

  const result = await generateObject({
    model: openai(OPENAI_MODEL),
    system: `You are a social-media copywriter. Output strictly via the schema.`,
    schema: TWITTER_SCHEMA,
    prompt: user,
  });

  return {
    caption: result.object.caption.slice(0, 280),
  };
}

// ---------- All-in-one (back-compat) ----------

export async function generateKdpMetadataHybrid(
  input: KdpMetadataInput,
): Promise<KdpMetadata> {
  const [kdp, etsy, gumroad, pinterest, instagram, twitter] =
    await Promise.all([
      generateKdpCore(input),
      generateEtsy(input).catch(() => undefined),
      generateGumroad(input).catch(() => undefined),
      generatePinterest(input).catch(() => undefined),
      generateInstagram(input).catch(() => undefined),
      generateTwitter(input).catch(() => undefined),
    ]);

  return {
    title: kdp.title,
    subtitle: kdp.subtitle,
    descriptionHtml: kdp.descriptionHtml,
    descriptionText: kdp.descriptionText,
    keywords: kdp.keywords,
    categories: kdp.categories,
    suggestedPriceUsd: kdp.suggestedPriceUsd,
    notes: kdp.notes,
    etsy,
    gumroad,
    pinterest,
    instagram,
    twitter,
  };
}
