/**
 * Second-pass proofreader for story-book plans. The planner is busy doing
 * structure, characters, palette, and dialogue all at once — quality on
 * the secondary task (spelling, complete sentences, missing words) drifts.
 *
 * This is a single cheap gpt-5-mini call that returns a corrections list
 * and we apply it to the plan in place. Only fixes mechanical defects
 * (typos, missing articles, dropped words, terminal punctuation) — never
 * rewrites story content.
 *
 * Wiring: called from `planStoryBook()` right before returning. The plan
 * shape is unchanged; only the strings get cleaned.
 */

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { StoryBookPlan } from "@/lib/story-book-planner";

const PROOFREAD_MODEL = "gpt-5-mini";

const correctionSchema = z.object({
  path: z
    .string()
    .min(1)
    .max(60)
    .describe(
      "Dot path of the field. Allowed values: 'title', 'coverTitle', 'description', 'scene', 'coverScene', 'backCoverTagline', 'theEndMessage', 'prompts[i].subject', 'prompts[i].narration', 'prompts[i].dialogue[j].text' (i and j are 0-based integers).",
    ),
  original: z.string().describe("The original string verbatim."),
  corrected: z.string().describe("The corrected string."),
  reason: z
    .string()
    .max(120)
    .describe("Short note on what defect was fixed (typo, missing word, etc.)."),
});

const CORRECTIONS_SCHEMA = z.object({
  corrections: z.array(correctionSchema).max(80),
});

type Correction = z.infer<typeof correctionSchema>;

interface Stringy {
  path: string;
  value: string;
}

function collectStrings(plan: StoryBookPlan): Stringy[] {
  const out: Stringy[] = [
    { path: "title", value: plan.title },
    { path: "coverTitle", value: plan.coverTitle },
    { path: "description", value: plan.description },
    { path: "scene", value: plan.scene },
    { path: "coverScene", value: plan.coverScene },
    { path: "backCoverTagline", value: plan.backCoverTagline },
    { path: "theEndMessage", value: plan.theEndMessage },
  ];
  plan.prompts.forEach((p, i) => {
    out.push({ path: `prompts[${i}].subject`, value: p.subject });
    if (p.narration)
      out.push({ path: `prompts[${i}].narration`, value: p.narration });
    p.dialogue?.forEach((d, j) => {
      out.push({
        path: `prompts[${i}].dialogue[${j}].text`,
        value: d.text,
      });
    });
  });
  return out;
}

function applyCorrections(
  plan: StoryBookPlan,
  corrections: Correction[],
): StoryBookPlan {
  const setters: Record<string, (v: string) => void> = {
    title: (v) => {
      plan.title = v;
    },
    coverTitle: (v) => {
      plan.coverTitle = v;
    },
    description: (v) => {
      plan.description = v;
    },
    scene: (v) => {
      plan.scene = v;
    },
    coverScene: (v) => {
      plan.coverScene = v;
    },
    backCoverTagline: (v) => {
      plan.backCoverTagline = v;
    },
    theEndMessage: (v) => {
      plan.theEndMessage = v;
    },
  };

  const promptField = /^prompts\[(\d+)\]\.(subject|narration)$/;
  const promptDialogue = /^prompts\[(\d+)\]\.dialogue\[(\d+)\]\.text$/;

  for (const c of corrections) {
    if (!c.corrected.trim() || c.corrected === c.original) continue;
    const top = setters[c.path];
    if (top) {
      top(c.corrected);
      continue;
    }
    const m1 = promptField.exec(c.path);
    if (m1) {
      const i = Number(m1[1]);
      const field = m1[2] as "subject" | "narration";
      const p = plan.prompts[i];
      if (!p) continue;
      if (p[field] !== c.original) continue;
      p[field] = c.corrected;
      continue;
    }
    const m2 = promptDialogue.exec(c.path);
    if (m2) {
      const i = Number(m2[1]);
      const j = Number(m2[2]);
      const line = plan.prompts[i]?.dialogue?.[j];
      if (!line) continue;
      if (line.text !== c.original) continue;
      line.text = c.corrected;
    }
  }
  return plan;
}

const SYSTEM = `You are a meticulous children's-book copy editor. Your only job is to find mechanical text defects and propose minimal corrections. You NEVER rewrite story content, NEVER change meaning, NEVER make stylistic edits. You ONLY fix:
- spelling errors (e.g. "supeworll" -> "superpower")
- missing words / dropped articles (e.g. "Thank for waiting" -> "Thank you for waiting")
- duplicated words (e.g. "the the cat")
- missing terminal punctuation on narration / dialogue lines (must end in . ! or ?)
- broken contractions and obvious typos
- impossible casing inside a normal sentence

Skip a field entirely if it is already clean. Output corrections only for fields that need fixing. Preserve the original word choice in everything else.`;

export async function proofreadStoryPlan(
  plan: StoryBookPlan,
): Promise<StoryBookPlan> {
  if (!process.env.OPENAI_API_KEY) return plan;
  const items = collectStrings(plan);
  const payload = items
    .map((it) => `${it.path}: ${JSON.stringify(it.value)}`)
    .join("\n");
  try {
    const result = await generateObject({
      model: openai(PROOFREAD_MODEL),
      system: SYSTEM,
      schema: CORRECTIONS_SCHEMA,
      prompt: `Proofread the following children's-book strings. For each defect, return a correction object with path, original, corrected, reason. Use the EXACT path strings shown on the left.\n\n${payload}`,
    });
    return applyCorrections(plan, result.object.corrections);
  } catch {
    return plan;
  }
}
