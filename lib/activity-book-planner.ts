import { GoogleGenAI } from "@google/genai";
import { GEMINI_TEXT_MODEL } from "@/lib/constants";
import { ICON_NAMES, isIconName } from "@/lib/activities/icons";
import { DOT_OUTLINE_NAMES } from "@/lib/activities/dot-outlines";
import { buildActivitySequence } from "@/lib/activities/sequence";

const PARAMETRIC_DOT_SHAPES = ["heart", "star", "flower", "circle"];
const DOT_SUBJECTS = [...PARAMETRIC_DOT_SHAPES, ...DOT_OUTLINE_NAMES];
const isDotSubject = (s: string): boolean => DOT_SUBJECTS.includes(s.toLowerCase());
import {
  PLANNABLE_TYPES,
  type ActivityAgeBand,
  type ActivityCounts,
  type ActivityDifficulty,
  type ActivitySpec,
  type ActivityType,
} from "@/lib/activities/types";

export { PLANNABLE_TYPES };

export interface ActivityBookPlanInput {
  idea: string;
  pageCount: number;
  age?: ActivityAgeBand;
  difficulty?: ActivityDifficulty;
  mix?: ActivityType[];
  counts?: ActivityCounts;
  weights?: Partial<Record<ActivityType, number>>;
  aiPictures?: boolean;
  regenerationHint?: string;
}

const DEFAULT_LETTER_WORDS: Record<string, string> = {
  A: "Apple", B: "Ball", C: "Cat", D: "Dog", E: "Egg", F: "Fish", G: "Goat",
  H: "Hat", I: "Igloo", J: "Jug", K: "Kite", L: "Lion", M: "Mango", N: "Nest",
  O: "Orange", P: "Pig", Q: "Queen", R: "Rabbit", S: "Sun", T: "Tree",
  U: "Umbrella", V: "Van", W: "Watch", X: "Xylophone", Y: "Yak", Z: "Zebra",
};

export interface ActivityBookPlan {
  title: string;
  coverTitle: string;
  description: string;
  coverScene: string;
  theme: string;
  pages: ActivitySpec[];
}

interface ContentPool {
  title: string;
  coverTitle: string;
  description: string;
  coverScene: string;
  theme: string;
  wordSets: string[][];
  crosswordWords: { answer: string; clue: string }[];
  phrases: string[];
  letters: string[];
  numbers: number[];
  shapes: string[];
  matchingSets: { left: string; right: string }[][];
  findLists: { label: string; count: number }[][];
  colorLegends: { n: number; label: string }[][];
  iconPool: string[];
  oppositePairs: { left: string; right: string }[];
  dotSubjects: string[];
  dotPuzzles: { subject: string; points: { x: number; y: number }[] }[];
  letterWords: Record<string, string>;
  objectWords: string[];
}

const SHAPES = ["heart", "star", "flower", "circle"];

function rampDifficulty(i: number, n: number): ActivityDifficulty {
  const f = n <= 1 ? 0 : i / (n - 1);
  return f < 0.34 ? "easy" : f < 0.67 ? "medium" : "hard";
}

function assemblePlan(input: ActivityBookPlanInput, pool: ContentPool): ActivityBookPlan {
  const age = input.age ?? "kids";
  const seq = buildActivitySequence({
    pageCount: input.pageCount,
    age: input.age,
    counts: input.counts,
    weights: input.weights,
    mix: input.mix,
  });
  const counters: Record<string, number> = {};
  const take = <T>(arr: T[], key: string, fallback: T): T => {
    if (!arr.length) return fallback;
    const idx = counters[key] ?? 0;
    counters[key] = idx + 1;
    return arr[idx % arr.length];
  };

  const pages: ActivitySpec[] = seq.map((type, i) => {
    const difficulty = input.difficulty ?? rampDifficulty(i, input.pageCount);
    const base = {
      id: `act.${String(i + 1).padStart(2, "0")}`,
      type,
      theme: pool.theme,
      difficulty,
      ageBand: age,
    };
    switch (type) {
      case "word-search":
        return { ...base, title: "Word Search", params: { words: take(pool.wordSets, "ws", ["FUN", "PLAY"]), seed: i + 1 } };
      case "crossword": {
        const start = (counters.cw ?? 0) * 8;
        counters.cw = (counters.cw ?? 0) + 1;
        const slice = pool.crosswordWords.slice(start, start + 10);
        return { ...base, title: "Crossword", params: { clues: slice.length >= 4 ? slice : pool.crosswordWords.slice(0, 10), seed: i + 1 } };
      }
      case "letter-tracing": {
        const ltr = take(pool.letters, "lt", "A").toUpperCase().slice(0, 1);
        const params: ActivitySpec["params"] = { letters: [ltr] };
        if (input.aiPictures) {
          params.referenceWord = pool.letterWords[ltr] ?? DEFAULT_LETTER_WORDS[ltr] ?? "";
        }
        return { ...base, title: "Trace the Letter", params };
      }
      case "number-tracing": {
        const params: ActivitySpec["params"] = { numbers: [take(pool.numbers, "nt", 1)] };
        if (input.aiPictures) params.referenceWord = take(pool.objectWords, "no", "stars");
        return { ...base, title: "Trace the Number", params };
      }
      case "sight-word-tracing":
        return { ...base, title: "Trace the Words", params: { phrase: take(pool.phrases, "sw", "I can read") } };
      case "dot-to-dot": {
        const puzzle = pool.dotPuzzles.length ? take(pool.dotPuzzles, "dd", pool.dotPuzzles[0]) : null;
        if (puzzle) {
          return { ...base, title: "Connect the Dots", params: { shape: puzzle.subject, dotPoints: puzzle.points, seed: i + 1 } };
        }
        return { ...base, title: "Connect the Dots", params: { shape: take(pool.dotSubjects, "dds", "star"), seed: i + 1 } };
      }
      case "shapes":
        return { ...base, title: "Trace the Shapes", params: { seed: i + 1 } };
      case "patterns": {
        const params: ActivitySpec["params"] = { iconNames: pool.iconPool, seed: i + 1 };
        if (input.aiPictures) {
          const objs = pool.objectWords.slice(0, 5);
          params.iconNames = objs;
          params.aiObjects = objs;
        }
        return { ...base, title: "Finish the Pattern", params };
      }
      case "sorting": {
        const params: ActivitySpec["params"] = { iconNames: pool.iconPool, seed: i + 1 };
        if (input.aiPictures) {
          const objs = pool.objectWords.slice(0, 5);
          params.iconNames = objs;
          params.aiObjects = objs;
        }
        return { ...base, title: "Which Is Different?", params };
      }
      case "opposites":
        return { ...base, title: "Match the Opposites", params: { oppositePairs: pool.oppositePairs, seed: i + 1 } };
      case "matching": {
        const set = take(pool.matchingSets, "mt", []);
        if (input.aiPictures && set.length) {
          const aiPairs = set.map((p) => ({ left: p.left, right: p.left.toLowerCase() }));
          return { ...base, title: "Match Them Up", params: { pairs: aiPairs, aiObjects: Array.from(new Set(aiPairs.map((p) => p.right))), seed: i + 1 } };
        }
        return { ...base, title: "Match Them Up", params: { pairs: set, seed: i + 1 } };
      }
      case "counting": {
        const params: ActivitySpec["params"] = { seed: i + 1, icon: take(pool.iconPool, "cnt", "star") };
        if (input.aiPictures) {
          const obj = take(pool.objectWords, "co", "star");
          params.icon = obj;
          params.aiObjects = [obj];
        }
        return { ...base, title: "Count & Write", params };
      }
      case "seek-and-find":
        return { ...base, title: "Seek & Find", params: { findList: take(pool.findLists, "sf", [{ label: "stars", count: 5 }]), seed: i + 1 } };
      case "color-by-number":
        return { ...base, title: "Color by Number", params: { paletteLegend: take(pool.colorLegends, "cbn", [{ n: 1, label: "red" }]), seed: i + 1 } };
      case "spot-difference":
        return { ...base, title: "Spot the Difference", params: { seed: i + 1 } };
      default:
        return { ...base, title: "Maze", params: { seed: i + 1 } };
    }
  });

  return {
    title: pool.title,
    coverTitle: pool.coverTitle,
    description: pool.description,
    coverScene: pool.coverScene,
    theme: pool.theme,
    pages,
  };
}

function fallbackPool(idea: string): ContentPool {
  const theme = idea.trim().split(/\s+/).slice(0, 3).join(" ") || "Fun";
  const cap = theme.replace(/\b\w/g, (m) => m.toUpperCase());
  return {
    title: `${cap} Activity Book for Kids — Mazes, Puzzles, Tracing & More`,
    coverTitle: `${cap} Activity Book`,
    description: `A fun-packed ${cap.toLowerCase()} activity book for kids — mazes, word searches, tracing, connect-the-dots, and more. Hours of screen-free learning and play.`,
    coverScene: `A happy child or friendly character actively doing an activity — solving a maze with a big pencil, tracing letters, or connecting dots — surrounded by playful ${cap.toLowerCase()} details and puzzle motifs`,
    theme: cap,
    wordSets: [
      ["STAR", "MOON", "SUN", "CLOUD", "RAIN", "TREE", "BIRD", "FISH"],
      ["CAT", "DOG", "COW", "PIG", "DUCK", "FROG", "BEAR", "LION"],
      ["RED", "BLUE", "GREEN", "PINK", "GOLD", "BLACK", "WHITE", "GRAY"],
    ],
    crosswordWords: [
      { answer: "CAT", clue: "A pet that says meow" },
      { answer: "STAR", clue: "It twinkles at night" },
      { answer: "TREE", clue: "It has leaves and branches" },
      { answer: "RAT", clue: "A small rodent" },
      { answer: "SEA", clue: "A big body of salt water" },
      { answer: "EAR", clue: "You hear with it" },
    ],
    phrases: ["I can run", "I see a cat", "We can play", "The sun is up", "I like to read"],
    letters: ["A", "B", "C", "D", "E", "F", "G", "H"],
    numbers: [1, 2, 3, 4, 5, 6, 7, 8],
    shapes: SHAPES,
    matchingSets: [
      [
        { left: "STAR", right: "star" },
        { left: "SUN", right: "sun" },
        { left: "FISH", right: "fish" },
        { left: "TREE", right: "tree" },
      ],
    ],
    iconPool: ["star", "heart", "apple", "fish", "balloon", "flower"],
    oppositePairs: [
      { left: "BIG", right: "SMALL" },
      { left: "UP", right: "DOWN" },
      { left: "HOT", right: "COLD" },
      { left: "DAY", right: "NIGHT" },
      { left: "FAST", right: "SLOW" },
      { left: "HAPPY", right: "SAD" },
    ],
    dotSubjects: ["star", "heart", "house", "fish", "tree", "flower", "cat", "car"],
    dotPuzzles: [],
    letterWords: DEFAULT_LETTER_WORDS,
    objectWords: ["apple", "star", "fish", "balloon", "flower", "house", "car", "sun", "tree", "heart"],
    findLists: [
      [
        { label: "stars", count: 5 },
        { label: "hearts", count: 4 },
        { label: "circles", count: 6 },
      ],
    ],
    colorLegends: [
      [
        { n: 1, label: "red" },
        { n: 2, label: "blue" },
        { n: 3, label: "green" },
        { n: 4, label: "yellow" },
      ],
    ],
  };
}

function buildContentPrompt(input: ActivityBookPlanInput): string {
  const ageLabel = input.age === "tweens" ? "ages 9-12" : input.age === "toddlers" ? "ages 3-5" : "ages 6-8";
  const hint = input.regenerationHint?.trim() ? `\nRegeneration tweak (hard override): ${input.regenerationHint.trim()}\n` : "";
  return `You plan content for a printable kids' ACTIVITY book sold on Amazon KDP, ${ageLabel}.
User idea: "${input.idea}".${hint}
Produce a themed content pool the puzzle engine will use. Words must be UPPERCASE A-Z only, 3-8 letters, age-appropriate, and on-theme. Crossword answers should share letters so they interlock.

For matching and counting, the engine can only DRAW these picture icons (use exactly these names, lowercase): ${ICON_NAMES.join(", ")}. Pick the icons from this list that best fit the theme.

For connect-the-dots, the engine can only draw these subject outlines (use exactly these names, lowercase): ${DOT_SUBJECTS.join(", ")}. Pick the ones that best fit the theme.

Respond with ONLY a JSON object (no prose, no code fences):
{
  "title": "full KDP title under 150 chars, includes 'Activity Book' and age range",
  "coverTitle": "short punchy title under 45 chars",
  "description": "25-45 word Amazon description",
  "coverScene": "a vibrant cover scene showing a happy child or friendly character ACTIVELY DOING an activity (solving a maze with a pencil, tracing, or connecting dots), surrounded by on-theme details and puzzle motifs",
  "theme": "1-2 word theme",
  "wordSets": [["WORD","WORD", ... 8 words], ... 4 sets],
  "crosswordWords": [{"answer":"CAT","clue":"..."}, ... 12 interlocking words],
  "phrases": ["short sight-word phrase", ... 6],
  "letters": ["A","B", ... 8 relevant letters],
  "numbers": [1,2, ... 8],
  "shapes": ["heart","star","flower","circle"],
  "matchingSets": [[{"word":"STAR","icon":"star"}, ... 4 pairs where icon is from the allowed list], ... 2 sets],
  "iconPool": ["icon names from the allowed list that fit the theme, 6-8 of them"],
  "dotSubjects": ["connect-the-dots subject names from the allowed outline list that fit the theme, 4-8 of them"],
  "dotPuzzles": [{"subject":"a simple on-theme object","points":[{"x":0,"y":-0.8}, ... 10-16 ordered points, x and y each between -1 and 1, tracing the subject's outline as ONE continuous loop (last point joins back to the first); keep it a clean recognizable silhouette a child can connect]}, ... 2-3 puzzles for subjects NOT in the outline list above],
  "letterWords": {"A":"on-theme object starting with A","B":"...", ... a single simple kid-friendly object word for EACH letter A-Z that fits the book theme (one or two syllables, drawable)},
  "objectWords": ["8-10 simple on-theme objects a child knows and that are easy to draw as a single clear picture (used for matching, counting, patterns, sorting)"],
  "oppositePairs": [{"left":"BIG","right":"SMALL"}, ... 6 simple opposite word pairs, UPPERCASE, 1-2 syllables, age-appropriate],
  "findLists": [[{"label":"on-theme thing","count":5}, ... 3 items], ... 2 sets],
  "colorLegends": [[{"n":1,"label":"red"}, ... 4 entries], ... 2 sets]
}`;
}

function coerceStr(o: Record<string, unknown>, k: string, fb: string): string {
  const v = o[k];
  return typeof v === "string" && v.trim() ? v.trim() : fb;
}

function parsePool(text: string, fb: ContentPool): ContentPool {
  try {
    const fenced = /```(?:json)?\s*([\s\S]+?)\s*```/i.exec(text);
    const raw = fenced ? fenced[1] : text;
    const slice = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const o = JSON.parse(slice) as Record<string, unknown>;
    const strArr = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.toUpperCase().replace(/[^A-Z]/g, "")).filter((x) => x.length >= 2) : [];
    const wordSets = Array.isArray(o.wordSets)
      ? (o.wordSets as unknown[]).map(strArr).filter((s) => s.length >= 3)
      : [];
    const crosswordWords = Array.isArray(o.crosswordWords)
      ? (o.crosswordWords as unknown[])
          .map((c) => c as Record<string, unknown>)
          .filter((c) => typeof c.answer === "string" && typeof c.clue === "string")
          .map((c) => ({ answer: (c.answer as string).toUpperCase().replace(/[^A-Z]/g, ""), clue: (c.clue as string).trim() }))
          .filter((c) => c.answer.length >= 2)
      : [];
    const phrases = Array.isArray(o.phrases) ? (o.phrases as unknown[]).filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean) : [];
    const matchingSets = Array.isArray(o.matchingSets)
      ? (o.matchingSets as unknown[])
          .map((set) =>
            Array.isArray(set)
              ? set
                  .map((p) => p as Record<string, unknown>)
                  .map((p) => {
                    const word = typeof p.word === "string" ? p.word : typeof p.left === "string" ? p.left : "";
                    const iconRaw = typeof p.icon === "string" ? p.icon : typeof p.right === "string" ? p.right : "";
                    return { left: word.trim().toUpperCase().slice(0, 12), right: iconRaw.trim().toLowerCase() };
                  })
                  .filter((p) => p.left && isIconName(p.right))
              : [],
          )
          .filter((s) => s.length >= 2)
      : [];
    const iconPool = Array.isArray(o.iconPool)
      ? (o.iconPool as unknown[]).filter((x): x is string => typeof x === "string").map((x) => x.toLowerCase().trim()).filter(isIconName)
      : [];
    const oppositePairs = Array.isArray(o.oppositePairs)
      ? (o.oppositePairs as unknown[])
          .map((p) => p as Record<string, unknown>)
          .filter((p) => typeof p.left === "string" && typeof p.right === "string")
          .map((p) => ({ left: (p.left as string).trim().toUpperCase().slice(0, 14), right: (p.right as string).trim().toUpperCase().slice(0, 14) }))
          .filter((p) => p.left && p.right)
      : [];
    const dotSubjects = Array.isArray(o.dotSubjects)
      ? (o.dotSubjects as unknown[]).filter((x): x is string => typeof x === "string").map((x) => x.toLowerCase().trim()).filter(isDotSubject)
      : [];
    const clampUnit = (n: number): number => Math.max(-1, Math.min(1, n));
    const dotPuzzles = Array.isArray(o.dotPuzzles)
      ? (o.dotPuzzles as unknown[])
          .map((p) => p as Record<string, unknown>)
          .map((p) => ({
            subject: typeof p.subject === "string" ? p.subject.trim().toLowerCase().slice(0, 24) : "",
            points: Array.isArray(p.points)
              ? (p.points as unknown[])
                  .map((q) => q as Record<string, unknown>)
                  .filter((q) => typeof q.x === "number" && typeof q.y === "number")
                  .map((q) => ({ x: clampUnit(q.x as number), y: clampUnit(q.y as number) }))
              : [],
          }))
          .filter((p) => p.subject && p.points.length >= 5 && p.points.length <= 40)
      : [];
    const objectWords = Array.isArray(o.objectWords)
      ? (o.objectWords as unknown[]).filter((x): x is string => typeof x === "string").map((x) => x.trim().toLowerCase().slice(0, 24)).filter(Boolean)
      : [];
    const letterWords: Record<string, string> = { ...DEFAULT_LETTER_WORDS };
    if (o.letterWords && typeof o.letterWords === "object") {
      for (const [k, v] of Object.entries(o.letterWords as Record<string, unknown>)) {
        const key = k.trim().toUpperCase().slice(0, 1);
        if (/[A-Z]/.test(key) && typeof v === "string" && v.trim()) {
          letterWords[key] = v.trim().slice(0, 24);
        }
      }
    }
    return {
      title: coerceStr(o, "title", fb.title),
      coverTitle: coerceStr(o, "coverTitle", fb.coverTitle),
      description: coerceStr(o, "description", fb.description),
      coverScene: coerceStr(o, "coverScene", fb.coverScene),
      theme: coerceStr(o, "theme", fb.theme),
      wordSets: wordSets.length ? wordSets : fb.wordSets,
      crosswordWords: crosswordWords.length >= 3 ? crosswordWords : fb.crosswordWords,
      phrases: phrases.length ? phrases : fb.phrases,
      letters: Array.isArray(o.letters) && o.letters.length ? (o.letters as unknown[]).filter((x): x is string => typeof x === "string").map((x) => x[0]?.toUpperCase()).filter(Boolean) : fb.letters,
      numbers: Array.isArray(o.numbers) && o.numbers.length ? (o.numbers as unknown[]).filter((x): x is number => typeof x === "number") : fb.numbers,
      shapes: SHAPES,
      matchingSets: matchingSets.length ? matchingSets : fb.matchingSets,
      iconPool: iconPool.length ? iconPool : fb.iconPool,
      oppositePairs: oppositePairs.length >= 3 ? oppositePairs : fb.oppositePairs,
      dotSubjects: dotSubjects.length ? dotSubjects : fb.dotSubjects,
      dotPuzzles: dotPuzzles.length ? dotPuzzles : fb.dotPuzzles,
      letterWords,
      objectWords: objectWords.length >= 4 ? objectWords : fb.objectWords,
      findLists: parseFindLists(o.findLists, fb.findLists),
      colorLegends: parseColorLegends(o.colorLegends, fb.colorLegends),
    };
  } catch {
    return fb;
  }
}

function parseFindLists(value: unknown, fb: ContentPool["findLists"]): ContentPool["findLists"] {
  if (!Array.isArray(value)) return fb;
  const out = (value as unknown[])
    .map((set) =>
      Array.isArray(set)
        ? (set as unknown[])
            .map((p) => p as Record<string, unknown>)
            .filter((p) => typeof p.label === "string" && typeof p.count === "number")
            .map((p) => ({ label: (p.label as string).trim(), count: Math.max(1, Math.round(p.count as number)) }))
        : [],
    )
    .filter((s) => s.length >= 2);
  return out.length ? out : fb;
}

function parseColorLegends(value: unknown, fb: ContentPool["colorLegends"]): ContentPool["colorLegends"] {
  if (!Array.isArray(value)) return fb;
  const out = (value as unknown[])
    .map((set) =>
      Array.isArray(set)
        ? (set as unknown[])
            .map((p) => p as Record<string, unknown>)
            .filter((p) => typeof p.n === "number" && typeof p.label === "string")
            .map((p) => ({ n: Math.round(p.n as number), label: (p.label as string).trim() }))
        : [],
    )
    .filter((s) => s.length >= 2);
  return out.length ? out : fb;
}

export async function planActivityBook(input: ActivityBookPlanInput): Promise<ActivityBookPlan> {
  const fb = fallbackPool(input.idea);
  const apiKey = process.env.GEMINI_NANO_BANANA_API_KEY;
  if (!apiKey) return assemblePlan(input, fb);
  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: [{ role: "user", parts: [{ text: buildContentPrompt(input) }] }],
    });
    const text =
      response.candidates?.[0]?.content?.parts
        ?.map((p) => (typeof (p as { text?: string }).text === "string" ? (p as { text: string }).text : ""))
        .join("") ?? "";
    return assemblePlan(input, parsePool(text, fb));
  } catch {
    return assemblePlan(input, fb);
  }
}
