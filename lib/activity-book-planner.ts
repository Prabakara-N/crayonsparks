import { GoogleGenAI } from "@google/genai";
import { GEMINI_TEXT_MODEL } from "@/lib/constants";
import {
  PLANNABLE_TYPES,
  type ActivityAgeBand,
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
  weights?: Partial<Record<ActivityType, number>>;
  regenerationHint?: string;
}

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
}

const SHAPES = ["heart", "star", "flower", "circle"];
const LINE_STYLES: ("straight" | "zigzag" | "curved")[] = ["straight", "zigzag", "curved"];

function rampDifficulty(i: number, n: number): ActivityDifficulty {
  const f = n <= 1 ? 0 : i / (n - 1);
  return f < 0.34 ? "easy" : f < 0.67 ? "medium" : "hard";
}

// Builds an interleaved page sequence honoring per-type weights (or an equal
// mix / all types). Each type gets a quota proportional to its weight, then we
// round-robin so types alternate rather than clustering.
function buildSequence(input: ActivityBookPlanInput, pageCount: number): ActivityType[] {
  let entries: [ActivityType, number][];
  const weights = input.weights;
  if (weights && Object.values(weights).some((w) => (w ?? 0) > 0)) {
    entries = (Object.entries(weights) as [ActivityType, number][]).filter(
      ([t, w]) => PLANNABLE_TYPES.includes(t) && (w ?? 0) > 0,
    );
  } else if (input.mix?.length) {
    entries = input.mix.filter((t) => PLANNABLE_TYPES.includes(t)).map((t) => [t, 1]);
  } else {
    entries = PLANNABLE_TYPES.map((t) => [t, 1]);
  }
  if (!entries.length) entries = PLANNABLE_TYPES.map((t) => [t, 1]);

  const totalW = entries.reduce((s, [, w]) => s + w, 0);
  const quotas = entries.map(([t, w]) => ({ t, q: Math.max(1, Math.round((w / totalW) * pageCount)) }));
  let sum = quotas.reduce((s, x) => s + x.q, 0);
  while (sum > pageCount) {
    quotas.sort((a, b) => b.q - a.q);
    if (quotas[0].q <= 1) break;
    quotas[0].q -= 1;
    sum -= 1;
  }
  while (sum < pageCount) {
    quotas.sort((a, b) => b.q - a.q);
    quotas[0].q += 1;
    sum += 1;
  }

  const seq: ActivityType[] = [];
  while (seq.length < pageCount) {
    let placed = false;
    for (const r of quotas) {
      if (r.q > 0 && seq.length < pageCount) {
        seq.push(r.t);
        r.q -= 1;
        placed = true;
      }
    }
    if (!placed) break;
  }
  return seq;
}

function assemblePlan(input: ActivityBookPlanInput, pool: ContentPool): ActivityBookPlan {
  const age = input.age ?? "kids";
  const seq = buildSequence(input, input.pageCount);
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
        const start = (counters.cw ?? 0) * 6;
        counters.cw = (counters.cw ?? 0) + 1;
        const slice = pool.crosswordWords.slice(start, start + 6);
        return { ...base, title: "Crossword", params: { clues: slice.length >= 3 ? slice : pool.crosswordWords.slice(0, 6), seed: i + 1 } };
      }
      case "letter-tracing":
        return { ...base, title: "Trace the Letter", params: { letters: [take(pool.letters, "lt", "A")] } };
      case "number-tracing":
        return { ...base, title: "Trace the Number", params: { numbers: [take(pool.numbers, "nt", 1)] } };
      case "sight-word-tracing":
        return { ...base, title: "Trace the Words", params: { phrase: take(pool.phrases, "sw", "I can read") } };
      case "dot-to-dot":
        return { ...base, title: "Connect the Dots", params: { shape: take(pool.shapes, "dd", "heart"), seed: i + 1 } };
      case "cut-lines":
        return { ...base, title: "Cut the Lines", params: { lineStyle: LINE_STYLES[i % LINE_STYLES.length] } };
      case "matching":
        return { ...base, title: "Match Them Up", params: { pairs: take(pool.matchingSets, "mt", []), seed: i + 1 } };
      case "counting":
        return { ...base, title: "Count & Write", params: { seed: i + 1 } };
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
    coverScene: `A cheerful ${cap.toLowerCase()} scene with puzzle motifs framing a bold activity-book title`,
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
        { left: "1", right: "one" },
        { left: "2", right: "two" },
        { left: "3", right: "three" },
        { left: "4", right: "four" },
      ],
    ],
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

Respond with ONLY a JSON object (no prose, no code fences):
{
  "title": "full KDP title under 150 chars, includes 'Activity Book' and age range",
  "coverTitle": "short punchy title under 45 chars",
  "description": "25-45 word Amazon description",
  "coverScene": "one vibrant colored cover scene with puzzle motifs",
  "theme": "1-2 word theme",
  "wordSets": [["WORD","WORD", ... 8 words], ... 4 sets],
  "crosswordWords": [{"answer":"CAT","clue":"..."}, ... 10 interlocking words],
  "phrases": ["short sight-word phrase", ... 6],
  "letters": ["A","B", ... 8 relevant letters],
  "numbers": [1,2, ... 8],
  "shapes": ["heart","star","flower","circle"],
  "matchingSets": [[{"left":"...","right":"..."}, ... 4 pairs], ... 2 sets],
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
          .map((set) => (Array.isArray(set) ? set.map((p) => p as Record<string, unknown>).filter((p) => typeof p.left === "string" && typeof p.right === "string").map((p) => ({ left: (p.left as string).trim(), right: (p.right as string).trim() })) : []))
          .filter((s) => s.length >= 2)
      : [];
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
