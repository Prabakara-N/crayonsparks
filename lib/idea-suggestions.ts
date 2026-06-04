import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { OPENAI_TEXT_MODEL, PRODUCT_NAME } from "@/lib/constants";

// Text-only generative idea list — cheaper than vision paths.
const MODEL_ID = OPENAI_TEXT_MODEL;

export type IdeaAudience = "any" | "toddlers" | "kids" | "tweens";

/**
 * Which flavor of suggestions to generate. Coloring-book ideas are theme-
 * shaped ("20 X with simple outlines for ages Y"); story-book ideas are
 * narrative-shaped (a fable title or a 1-line original story for ages Y).
 */
export type IdeaKind = "coloring" | "story" | "activity";
export type IdeaStoryType =
  | "moral"
  | "fiction"
  | "non-fiction"
  | "mystery"
  | "fantasy"
  | "comic"
  | "fairytale"
  | "adventure"
  | "bedtime";

export interface IdeaSuggestion {
  text: string;
  category: string;
  icon: string;
}

export function extractPageCountFromIdeaText(text: string): number | null {
  const m = text.match(/(\d+)\s*[-–]?\s*(?:page|scene|prompt)s?/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (Number.isNaN(n)) return null;
  return Math.min(50, Math.max(5, n));
}

export function categoryToStoryType(category: string): IdeaStoryType | null {
  const c = category.trim().toUpperCase();
  if (c === "FABLE" || c === "MORAL") return "moral";
  if (c === "FAIRYTALE" || c === "FAIRY TALE") return "fairytale";
  if (c === "BEDTIME") return "bedtime";
  if (c === "MYSTERY") return "mystery";
  if (c === "FANTASY") return "fantasy";
  if (c === "ADVENTURE") return "adventure";
  if (c === "COMIC" || c === "COMEDY") return "comic";
  if (c === "NON-FICTION" || c === "NONFICTION") return "non-fiction";
  if (c === "ORIGINAL" || c === "FICTION") return "fiction";
  return null;
}

const AUDIENCE_NOTES: Record<IdeaAudience, string> = {
  any: "Mix kid audiences (toddlers, kids, tweens). Show breadth.",
  toddlers:
    "Target 3-6 year olds. Simple shapes, friendly characters, familiar subjects, easy page concepts.",
  kids: "Target 6-10 year olds. Adventure, varied subjects, playful scenes, stronger page variety.",
  tweens:
    "Target 10-14 year olds. More intricate pages, stylish niches, complex subjects, richer themes.",
};

const STORY_TYPE_NOTES: Record<IdeaStoryType, string> = {
  moral:
    "Focus every idea on a clear moral lesson shown through events, not a slogan.",
  fiction:
    "Focus every idea on an original character-driven beginning, middle, and end.",
  "non-fiction":
    "Focus every idea on factual learning presented as a gentle narrative tour.",
  mystery:
    "Focus every idea on a small kid-safe puzzle, lost item, or curious clue trail.",
  fantasy:
    "Focus every idea on a grounded magical world with one clear wonder rule.",
  comic:
    "Focus every idea on humor, expressive reactions, and mild visual gags.",
  fairytale:
    "Focus every idea on fairytale structure: wonder, transformation, and happy ending.",
  adventure:
    "Focus every idea on a journey, discovery, setback, and warm triumph.",
  bedtime:
    "Focus every idea on calm pacing, cozy scenes, and a gentle wind-down ending.",
};

const COLORING_SYSTEM_PROMPT = `You are Sparky AI — the idea generator for ${PRODUCT_NAME} coloring book creators selling on Amazon KDP.

GOAL
Suggest 8 distinct coloring book ideas for the user to choose from. Each idea is one short sentence the user could paste into a "describe your book" field.

RULES
- Mix proven KDP seller categories with one or two fresher niche angles that still have search demand.
- Prefer ideas that are emotionally useful for parents, visually cute for kids, and easy to extend into repeat product lines.
- Strong niches should work beyond one book: coloring pages first, with optional reuse as worksheets, activity pages, flashcards, posters, or other printables.
- Favor low-text, high-illustration concepts where the visual value is obvious from a cover thumbnail.
- Keep coloring suggestions visual-first: clear page subjects, printable variety, simple age-fit, and reusable illustration sets.
- Do not steer coloring suggestions toward story-first niches unless the user explicitly asks for a story spin-off.
- Each idea: 10-18 words. Specific enough to be a directly usable prompt — say WHAT goes on the pages, not just the genre.
- Avoid (too vague): "Ocean creatures"
- Avoid ideas that are too long, generic, or missing audience/page-count cues.
- Avoid copyrighted material (Disney, Pokémon, Marvel, brand logos, real celebrities).
- No duplicates or near-duplicates within a single batch.
- Use a category tag from this set: Animals, Vehicles, Fantasy, Holiday, Mandala, Nature, Space, Food, Sports, Mythology, Educational, Character.
- Each idea has ONE compact icon marker.`;

const STORY_SYSTEM_PROMPT = `You are Sparky AI — the idea generator for ${PRODUCT_NAME} story-book (full-color picture book) creators selling on Amazon KDP.

GOAL
Suggest 8 distinct STORY ideas for the user to choose from. Each idea is one short sentence the user could paste into a "tell me your story idea" field. The output is a full-color picture book with locked characters and per-page dialogue — NOT a coloring book.

RULES
- Mix classic public-domain fables with original story ideas.
- Of the 8 ideas, aim for about 4 recognizable public-domain titles and about 4 original story premises.
- Prefer original premises with a parent-useful emotional hook: confidence, kindness, sharing, bedtime calm, first-day courage, patience, independence, friendship, or gentle problem-solving.
- Strong story niches should be visually cute for kids and reusable as a product line: storybook, matching coloring book, worksheets, activity pages, posters, or classroom printables.
- Favor low-text, high-illustration premises with one simple emotional arc and a character that can carry many related products.
- Prefer the low-competition story formula Emotion + Animal + Learning for original premises: one cute animal protagonist, one parent-useful emotion or value, and one learnable behavior arc.
- EXAMPLE illustrative only, do not literally use these elements unless they match this book: elephant learns confidence, turtle learns patience, lion learns kindness.
- Give extra weight to evergreen KDP story niches: alphabet adventure stories, bedtime calm stories, feelings/emotions stories, social-skills stories, and gentle interactive adventure stories.
- For interactive adventure suggestions, use a simple choose-a-path feel, but keep the proposed book plan easy to render as a linear picture book unless the user explicitly asks for printable games, mazes, or puzzles.
- Each idea: 10-18 words. Specific enough to be a directly usable prompt — name the protagonist OR the fable title, the audience, and the page count.
- Avoid (too vague): "An animal story"
- Avoid ideas that are too long, generic, or missing audience/scene-count cues.
- Avoid copyrighted characters (Disney/Pixar versions, Marvel, Pokemon, branded characters, real celebrities). Public-domain folktales and fully original stories ONLY.
- No duplicates or near-duplicates within a single batch.
- Use a category tag from this set: Fable, Fairytale, Bedtime, Adventure, Mystery, Mythology, Original, Educational.
- Each idea has ONE compact icon marker.`;

const ACTIVITY_SYSTEM_PROMPT = `You are Sparky AI — the idea generator for ${PRODUCT_NAME} ACTIVITY / PUZZLE / workbook creators selling on Amazon KDP and Etsy.

GOAL
Suggest 8 distinct ACTIVITY-BOOK ideas. Each idea is one short sentence the user could paste into a "describe your activity book" field. The output is a printable workbook of puzzles and exercises (mazes, word searches, tracing, dot-to-dot, matching, counting, color-by-number, spot-the-difference) — NOT a story and NOT a plain coloring book.

RULES
- Cover a SPREAD of angles across the 8 ideas — do not make them all themed-animal packs:
  - About 3 EDUCATIONAL ideas (alphabet ABC tracing, numbers & counting 1-20, shapes & colors, sight words, early math, phonics).
  - About 3 THEMED ideas (a fun subject like ocean, space, dinosaurs, farm, vehicles applied across activity types).
  - About 2 GENERAL "big fun activity book / brain games" ideas not tied to one narrow subject.
- Match activity types to age: ages 3-5 use tracing, dot-to-dot, simple mazes, matching, counting, color-by-number — NO word searches or crosswords (pre-readers can't read). Ages 6-8 and 9-12 can include word searches and crosswords.
- Each idea: 10-20 words. Name the focus/theme, the audience age, and the page count. Mention 2-4 activity types where natural.
- Avoid copyrighted material (Disney, Pokemon, Marvel, brand logos, real celebrities).
- No duplicates or near-duplicates within a single batch.
- Use a category tag from this set: Educational, Animals, Space, Nature, Vehicles, Holiday, Preschool, General.
- Each idea has ONE compact icon marker.`;

const ideaSchema = z.object({
  ideas: z
    .array(
      z.object({
        text: z.string().min(20).max(200),
        category: z.string().min(2).max(20),
        icon: z.string().min(1).max(4),
      }),
    )
    .min(6)
    .max(10),
});

export async function generateIdeaSuggestions(
  audience: IdeaAudience = "any",
  kind: IdeaKind = "coloring",
  storyType?: IdeaStoryType | null,
  activities?: string[],
): Promise<IdeaSuggestion[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const audienceNote = AUDIENCE_NOTES[audience] ?? AUDIENCE_NOTES.any;
  const storyTypeNote =
    kind === "story" && storyType
      ? `Selected story type: ${storyType}. ${STORY_TYPE_NOTES[storyType]} All 8 ideas must fit this type; do not mix unrelated story types.`
      : "Story type: no preference. Mix compatible story shapes naturally.";
  // When the user has picked specific activity types, center the suggestions on
  // them; otherwise stay general across all activity types.
  const activityNote =
    kind === "activity" && activities && activities.length
      ? `\nActivity focus: the user has CHOSEN these activity types — ${activities.join(", ")}. Build the 8 ideas around these activities (they are the backbone of every suggested book); you may add 1-2 complementary types, but do not center ideas on unrelated activities.`
      : "";
  const system =
    kind === "story"
      ? STORY_SYSTEM_PROMPT
      : kind === "activity"
        ? ACTIVITY_SYSTEM_PROMPT
        : COLORING_SYSTEM_PROMPT;

  const result = await generateObject({
    model: openai(MODEL_ID),
    system,
    prompt:
      kind === "story"
        ? `Suggest 8 ideas. Audience focus: ${audienceNote}\n${storyTypeNote}`
        : `Suggest 8 ideas. Audience focus: ${audienceNote}${activityNote}`,
    schema: ideaSchema,
  });

  return result.object.ideas
    .map((i) => ({
      text: i.text.trim(),
      category: i.category.trim(),
      icon: i.icon.trim().slice(0, 4) || "📚",
    }))
    .filter((i) => i.text.length >= 20);
}
