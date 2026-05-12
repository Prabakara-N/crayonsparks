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
export type IdeaKind = "coloring" | "story";
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
  /** One-line book idea (~10-18 words) the user pastes into the idea textarea. */
  text: string;
  /** Short tag the panel shows next to the idea (e.g. "Animals", "Holiday"). */
  category: string;
  /** Compact visual marker for scanability. */
  icon: string;
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
): Promise<IdeaSuggestion[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const audienceNote = AUDIENCE_NOTES[audience] ?? AUDIENCE_NOTES.any;
  const storyTypeNote =
    kind === "story" && storyType
      ? `Selected story type: ${storyType}. ${STORY_TYPE_NOTES[storyType]} All 8 ideas must fit this type; do not mix unrelated story types.`
      : "Story type: no preference. Mix compatible story shapes naturally.";
  const system =
    kind === "story" ? STORY_SYSTEM_PROMPT : COLORING_SYSTEM_PROMPT;

  const result = await generateObject({
    model: openai(MODEL_ID),
    system,
    prompt:
      kind === "story"
        ? `Suggest 8 ideas. Audience focus: ${audienceNote}\n${storyTypeNote}`
        : `Suggest 8 ideas. Audience focus: ${audienceNote}`,
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
