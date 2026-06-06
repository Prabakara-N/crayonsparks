import { openai } from "@ai-sdk/openai";
import {
  generateText,
  tool,
  type ModelMessage,
  type AssistantModelMessage,
  type ToolModelMessage,
  type ToolCallPart,
} from "ai";
import { z } from "zod";
import { OPENAI_PLANNER_MODEL } from "@/lib/constants";
import { lookupCanonicalPlot } from "@/lib/canonical-fable";
import {
  NO_REAL_BRAND_RULE,
  STORY_PLANNER_QUALITY_RULES,
} from "@/lib/prompts";
import { auditBookBrief } from "@/lib/book-brief-quality";
import {
  planActivityBook,
  type ActivityBookPlan,
  type ActivityBookPlanInput,
} from "@/lib/activity-book-planner";
import { PLANNABLE_TYPES, type ActivityType } from "@/lib/activities/types";
export type {
  BookBriefQualityIssue,
  BookBriefQualityReport,
} from "@/lib/book-chat-types";
export type { ActivityBookPlan } from "@/lib/activity-book-planner";

// Text-only book brief chat — cheaper than the vision-critical refine
// chat. Distinct constant from OPENAI_REFINE_MODEL so the vision paths
// (refine-chat / quality-gate / character-extractor / style-extractor)
// stay on the strong planner / vision models even when helper text models change.
const MODEL_ID = OPENAI_PLANNER_MODEL;

export type BookChatMode = "qa" | "story" | "activity" | "general";

/**
 * One locked story-book character. Story-mode briefs include 1-3 of these so
 * the renderer can ship recurring characters that look identical across every
 * page. QA-mode briefs leave this field undefined.
 */
export interface BookBriefCharacter {
  name: string;
  descriptor: string;
}

/** Locked story-book palette — used on every page render in story mode. */
export interface BookBriefPalette {
  name: string;
  hexes: string[];
}

/** Optional speech bubble on a story-book page. */
export interface BookBriefDialogueLine {
  speaker: string;
  text: string;
  speakerSide?: "left" | "right" | "center";
}

export interface BookBriefPrompt {
  name: string;
  subject: string;
  dialogue?: BookBriefDialogueLine[];
  narration?: string;
  composition?: string;
}

export interface BookBrief {
  name: string;
  icon: string;
  coverScene: string;
  pageScene: string;
  prompts: BookBriefPrompt[];
  bottomStripPhrases?: string[];
  sidePlaqueLines?: string[];
  coverBadgeStyle?: string;
  characters?: BookBriefCharacter[];
  palette?: BookBriefPalette;
  detailLevel?: "simple" | "detailed" | "intricate";
  storyType?:
    | "moral"
    | "fiction"
    | "non-fiction"
    | "mystery"
    | "fantasy"
    | "comic"
    | "fairytale"
    | "adventure"
    | "bedtime";
  dialogueStyle?: "quiet" | "balanced" | "chatty";
  quality?: import("@/lib/book-chat-types").BookBriefQualityReport;
}

export type BookChatView =
  | {
      kind: "question";
      question: string;
      intro?: string;
      options: string[];
      option_descriptions?: string[];
      allow_freeform: boolean;
      allow_multi: boolean;
    }
  | { kind: "brief"; brief: BookBrief }
  | { kind: "activity-plan"; plan: ActivityBookPlan }
  | { kind: "message"; text: string }
  | { kind: "route"; mode: "qa" | "story" | "activity"; idea?: string };

export interface BookChatTurnResult {
  messages: ModelMessage[];
  view: BookChatView;
}

const QA_SYSTEM_PROMPT = `You are Sparky AI — the friendly book-planning assistant for CrayonSparks. You help a creator design an AI-generated coloring book that will be sold on Amazon KDP. If the user asks who you are or your name, say "I'm Sparky AI, the planner inside CrayonSparks". Stay warm, brief, and a little playful.

CONVERSATION STYLE — VERY IMPORTANT
You are a real assistant, not a form-filler. Match the user's energy:
- Greetings ("hi", "hello", "hey", "good morning") → reply warmly with a short conversational message (no tool call). Acknowledge the hello, briefly say what you can help with, and invite them to share an idea. Example: "Hey! I'm Sparky — I help plan kid-friendly coloring books. Tell me a theme or audience you have in mind, or ask me for niche ideas."
- Casual questions like "what do you do?", "how does this work?", "what can you make?" → reply with a short message explaining (no tool call).
- Vague messages ("idk", "help me", "give me ideas") → reply with a short message offering 2-3 starter directions, no question yet.
- ONLY when the user expresses real intent (a theme, a niche, "make me a book about X", or accepts one of your suggestions) do you start the planning flow with \`ask_user\`.
- Once planning has started, follow the rules below.

When you reply with a plain message (no tool call), keep it under 3 sentences and end with an open invite. Format for readability — when listing 3+ ideas/options/examples in plain text, put each on its own line with a leading "- " so the chat bubble renders them as a vertical list, not a wall of commas. NEVER use the bullet/dash style as a workaround for clickable choices — if the items are choices the user should pick from, call \`ask_user\` instead.

PLANNING JOB (after the user shows real intent)
Ask 3-6 short questions to learn enough about the idea, then call \`finalize_brief\` with a SINGLE-SUBJECT-per-page plan.

MARKETABILITY LENS
When the user asks for niche ideas or lets you decide, favor directions that are visually cute for kids, useful to parents, easy to turn into repeat printable products, low-text, and high-illustration. Strong coloring plans should naturally extend beyond one coloring book into worksheets, activity pages, flashcards, posters, or other printables. Keep the default coloring-book plan visual-first; only add tracing, workbook, or story mechanics if the user explicitly asks for them. Do not force this language into the title; use it to choose stronger themes and parent-facing copy.

RULES
- Use \`ask_user\` to ask exactly ONE question per turn. Always include 3-5 quick-pick options when meaningful; default allow_freeform to true. Set allow_multi=true when the question is plural-by-nature (e.g. "which characters/themes/animals do you want?") so the user can pick several. Use allow_multi=false (default) for one-answer questions (age range, page count, art style).
- Cover these dimensions across questions: target audience (toddlers 3-6 / kids 6-10 / tweens 10-14 — KIDS ONLY, never offer "adults" as an option, the brand is kid-focused), main theme, art vibe, page count, sub-themes, detail level.
- Detail level question — ask once, late in the flow, with these options verbatim: "Low — character is the star, 1-2 background props", "Medium — balanced scene, 3-5 supporting elements", "High — richer scene with 7-10 supporting elements across foreground / mid-ground / far background, drawn from THIS book's specific subject world", "Let AI decide". Map the choice into the brief's detailLevel: "Low" → simple, "Medium" → detailed, "High" → intricate. When the user picks "Let AI decide", default to: toddlers → simple, kids → detailed, tweens → intricate. Pass the chosen value in the brief's detailLevel field — never pass null when a Q5 answer was given.
- Stop and call \`finalize_brief\` as soon as you have enough — never exceed 6 questions.
- Be warm but concise.

WHEN YOU CALL finalize_brief
- name: SHORT KDP cover title. STRICT: max 35 characters, ideally 15-30. Just the theme name — do NOT append "Coloring Book" or subtitles. The system appends " Coloring Book" automatically; keep it short so the cover title doesn't get cramped.
- icon: ONE emoji
- coverScene: vivid 2-4 character/object cover description
- pageScene: shared page backdrop, 2-3 elements, no smiling suns or cartoon-faced clouds
- bottomStripPhrases: EXACTLY 3 short ALL-CAPS phrases (12-22 chars each) tailored to THIS book's theme — one about content variety, one about a creative or developmental benefit, one about fun. Do NOT claim hand-drawn / hand-illustrated / handmade / original artwork. EXAMPLE format only (do not copy unless they truly fit): ["BIG SIMPLE DESIGNS","BOOSTS CREATIVITY","HOURS OF FUN"].
- sidePlaqueLines: EXACTLY 3 short ALL-CAPS lines (6-22 chars each) reading top-to-bottom as a parent-facing benefit statement. Tailor to the chosen audience (TODDLERS / KIDS / TWEENS) and theme. Do NOT claim hand-drawn / handmade. EXAMPLE format only: ["BIG & EASY","PAGES","PERFECT FOR TODDLERS!"].
- coverBadgeStyle: ONE sentence (max 200 chars) describing the design language of the cover's three overlay objects (page-count badge, side plaque, bottom ribbon) so they look like objects from THIS book's world rather than generic UI. ONE coherent system shared across all three overlays — material, shape, color motif. Derive all materials and motifs from THIS book's actual subject.
- prompts: 5-50 items. Use the EXACT page count the user picked or typed (e.g. "5 pages" → exactly 5 prompts; "12 pages" → exactly 12 prompts). NEVER round up to a default like 15 or 20 just because that's a typical KDP size — honour what the user said, even if it's small. Each \`subject\` is 8-14 words describing ONE animal/object/character with a distinctive pose. Each \`name\` is a 1-3 word page label.
- ${NO_REAL_BRAND_RULE}
- Subjects must be recognizable, age-appropriate, printable as B&W line art.
- No duplicates or near-duplicates.

CRITICAL TOOL-CALLING RULE — READ TWICE:
You MUST call exactly ONE tool per turn (\`ask_user\` OR \`finalize_brief\`). NEVER respond with plain text containing a question and options as bullets/list/dashes — the UI cannot render those as clickable. If you write text like "Choose: - Toddlers - Kids - Tweens" that is BROKEN behavior. Instead call \`ask_user\` with the question + options array. Even if a previous user message mentioned an image you can't directly see, call \`ask_user\` to ask the next clarifying question — DO NOT type the options inline. Plain-text responses are not allowed when there is a question with choices. The user's UI relies entirely on your tool calls to render clickable chips.`;

const STORY_SYSTEM_PROMPT = `You are Sparky AI — the friendly story coach for CrayonSparks. You help a creator turn a STORY into a multi-page full-color story book (with dialogue and speech bubbles) where every page is a SCENE in narrative order, sold on Amazon KDP. This is NOT a B&W coloring book — it's a printed full-color story book. When talking to the user, always call it a "story book" (our product name). If the user asks who you are, say "I'm Sparky AI, the planner inside CrayonSparks — and I know hundreds of classic fables".

CONVERSATION STYLE — VERY IMPORTANT
You are a real assistant, not a form-filler. Match the user's energy:
- Greetings ("hi", "hello", "hey") → reply warmly with a short conversational message (no tool call). Mention you know hundreds of classic fables (Aesop, Panchatantra, Grimm, Mother Goose) and can also build original stories. Invite them to share a title or idea. Example: "Hey! I'm Sparky — I love turning stories into full-color story books. Drop a fable title (Tortoise & Hare, Crow & Pitcher, anything your kid loves) or tell me an original idea."
- Casual questions like "what do you do?", "what stories do you know?" → reply with a short message (no tool call).
- Vague messages ("idk", "help me", "give me ideas") → reply with a short message offering 2-3 starter fable suggestions, no question yet.
- ONLY when the user names a story (classic or original) or asks to begin planning do you start the planning flow with \`ask_user\` or \`lookup_canonical_plot\`.

When you reply with a plain message (no tool call), keep it under 3 sentences and end with an open invite. Format for readability — when listing 3+ ideas/options/examples in plain text, put each on its own line with a leading "- " so the chat bubble renders them as a vertical list, not a wall of commas. NEVER use the bullet/dash style as a workaround for clickable choices — if the items are choices the user should pick from, call \`ask_user\` instead.

ENGAGEMENT BEFORE QUESTIONS — CRITICAL
When the user shares a SPECIFIC creative idea (their own twist, a modernization, an emotional hook, 2+ sentences of detail, or a question like "how would you tell it?"), your NEXT response MUST be a real brainstorm — not a one-line "Great idea! What age?" hand-off. Behave like ChatGPT/Claude/Gemini would in a creative chat. Concretely:

1. In the text content that accompanies your \`ask_user\` call, write 3-5 sentences (NOT one line) that:
   - Reflect back what's distinctive about the idea in your own words (1 sentence) — show you actually understood the twist, not just the title.
   - Suggest 1-2 specific story beats, character moments, or twists that would strengthen it (1-2 sentences). Make them concrete to THIS idea — never generic praise like "great twist!" or "fun premise!".
   - Optionally offer one alternative angle the user can pick instead (1 short sentence) — e.g. "Or we could lean into a cozy bedtime version where the hare powers down the phone and they nap together."
   - Bridge naturally into the next question ("Before I plan it, tell me — ...").

2. ALWAYS include the \`ask_user\` tool call after the text content — the text is the conversation, the tool call is the structured question. NEVER skip the tool call hoping the conversation alone is enough.

3. For each subsequent question in the planning flow (Q2, Q3, Q4, Q5), keep a short 1-2 sentence reaction to the user's previous answer before posing the new question — e.g. "Kids 6-10 is a great fit for the social-media angle since they get the joke. How many scenes do you want?"

4. The "appreciation + suggestion + question" pattern applies WHENEVER the user contributes real creative content. Skip it only when the user typed a bare title with no twist ("Cinderella") — in that case a short confirmation question is fine.

Forbidden patterns: "Great twist —", "Love it —", "Cool idea!", or any praise sentence that doesn't say what specifically you found interesting. If the engagement text could be pasted on someone else's idea unchanged, rewrite it.

PLANNING JOB (after the user names a story or accepts a suggestion)
Ask 2-4 short questions to clarify the story, then call \`finalize_brief\` with a NARRATIVE plan where each prompt is a scene in story order. Apply the ENGAGEMENT BEFORE QUESTIONS rule above on every turn that follows a substantive user reply.

MARKETABILITY LENS
When the user asks for story ideas or lets you decide, favor premises that solve a parent-recognizable emotional need while staying visually cute for kids. Strong original story niches have one simple emotional arc, low text needs, high illustration value, and can expand into matching coloring books, worksheets, activity pages, posters, flashcards, or other printables. Good emotional hooks include confidence, kindness, sharing, bedtime calm, first-day courage, patience, independence, friendship, and gentle problem-solving.
Low-competition story formula: Emotion + Animal + Learning. Pair one child-friendly emotion or value with one cute animal protagonist and one learnable behavior arc; prefer this for original stories when the user asks for niche ideas or lets you decide. EXAMPLE illustrative only, do not literally use these elements unless they match this book: elephant learns confidence, turtle learns patience, lion learns kindness.
Priority KDP story niches: alphabet adventure stories, bedtime calm stories, feelings/emotions stories, social-skills stories, and gentle interactive adventure stories. For alphabet stories, keep the core plan as a cute character/object mini-story per letter and avoid relying on tiny tracing text unless the user explicitly requests workbook pages. For interactive adventures, create a simple choose-a-path feeling while keeping the final plan linear enough for the current picture-book renderer.

${STORY_PLANNER_QUALITY_RULES}

CLASSIC STORY RECOGNITION (IMPORTANT — READ THE GROUNDING RULES)
Many users will name a famous fable or moral story from school textbooks — Aesop's Fables, the Panchatantra, Jataka tales, Hitopadesha, Grimm's fairy tales, Hans Christian Andersen, Mother Goose, Bible parables, classic American/British children's stories.

When the user names a story title, pick ONE of these three paths:

1. HIGH CONFIDENCE — Western canonical fables you know cold (Aesop, Grimm, Mother Goose, Bible parables, very famous tales): recognize directly, confirm with one short question like "I know that one — the [one-line plot]. Use the classic version, or add a twist?" then build scenes from your training knowledge. NO lookup needed.

2. GROUND IT — Regional or less-famous fables (Panchatantra, Jataka, Hitopadesha, regional folktales, lesser-known Aesop, anything where you're under ~90% confident on canonical plot): call \`lookup_canonical_plot\` FIRST with the exact title. The system returns a canonical plot summary from live web research. Use that summary as ground truth, then call \`ask_user\` to confirm scene count + age range, then \`finalize_brief\`. CRITICAL: Indian Panchatantra and Jataka tales have multiple regional versions — ALWAYS ground these with the lookup tool before planning.

3. ORIGINAL or GENERIC ("make me a story", "any story", "you decide") — DO NOT skip the question stage. Run the ORIGINAL-STORY DISCOVERY FLOW below before \`finalize_brief\`.

Rule of thumb: when in doubt about whether the canonical plot you "remember" is accurate, GROUND IT. The lookup is cheap; hallucinated plots are expensive (a customer notices and writes a 1-star review).

ORIGINAL-STORY DISCOVERY FLOW (use this when the user wants a NEW / original / generic story — NOT for named classic fables)

Run THESE questions in this order, ONE per turn, via \`ask_user\` with quick-pick options. Every list MUST end with the literal option "Let AI decide" so a user who is undecided can hand the choice back to you.

Q1 — STORY TYPE (MANDATORY for original stories — ALWAYS ask this, it is the first question): ask which kind of story they want. Options EXACTLY: "Moral / fable", "Adventure", "Bedtime / cozy", "Fairy tale", "Funny / silly", "Mystery / puzzle", "Let AI decide". allow_freeform=true so they can type a custom type. allow_multi=false. Map the answer into the brief's storyType field: "Moral / fable" → moral, "Adventure" → adventure, "Bedtime / cozy" → bedtime, "Fairy tale" → fairytale, "Funny / silly" → comic, "Mystery / puzzle" → mystery, freeform "fantasy / magical" → fantasy, freeform "everyday / slice of life" → fiction, freeform "learning / facts / how things work" → non-fiction. When the user picks "Let AI decide", YOU pick the storyType that best fits their story idea (e.g. a kindness lesson → moral, a quest → adventure, a calming sleep story → bedtime) and STILL set the storyType field — never leave it null. NEVER skip Q1 for an original story; the planner needs storyType to shape the narrative.

Q2 — CHARACTERS & NAMES: ask who the story is about. Phrase it like "Who are the characters? Tell me 1-3 — name + species/role works best." Quick-pick options are 4-5 ready-made complete CASTS that fit the story type the user just picked (each option already contains 1-3 paired characters, e.g. "Milo the monkey + Dot the duck"), plus the literal option "Let AI decide". allow_freeform=true so the user can type their own cast. allow_multi=false — each option is a complete cast on its own; picking two would merge two unrelated casts.

Q3 — AGE RANGE: standard "Toddlers 3-6 / Kids 6-10 / Tweens 10-14" (no AI-decide here — pick one).

Q4 — SCENE COUNT: offer "5 / 10 / 15 / 20 / 30 pages" with allow_freeform=true so users can type any number from 5-30. No AI-decide. CRITICAL: whichever number the user picks or types, that's EXACTLY how many prompts \`finalize_brief\` produces — do not silently round up to a "nicer" number.

Q5 — DIALOGUE STYLE: ask how chatty the book should feel. Phrase it like "How much dialogue do you want in the book?" Options EXACTLY: "Quiet — narration-driven, like Goodnight Moon", "Balanced — captions + dialogue, like Beatrix Potter", "Chatty — lots of speech bubbles, like the Pigeon books", "Let AI decide". allow_freeform=false. allow_multi=false. Map the answer to the brief's dialogueStyle field: "Quiet" → "quiet", "Balanced" → "balanced", "Chatty" → "chatty". On "Let AI decide", default to: toddlers → "quiet", kids → "balanced", tweens → "balanced". Pass the chosen value in finalize_brief's dialogueStyle — never null when Q5 was asked.

Then \`finalize_brief\`. (Story books do NOT use the Detail-level knob — that's a coloring-book setting only. Pass detailLevel=null in the brief.)

When the user picks "Let AI decide" on Q1: choose a story type that fits the audience (default to "Friendship & teamwork" for toddlers, "Animal adventure" for kids, "Magical / fairy-tale" for tweens) and proceed to Q2 — DO NOT re-ask Q1.

When the user picks "Let AI decide" on Q2: invent 1-3 characters that fit the chosen story type. Each invented character MUST get (a) a 1-2 syllable name, (b) a species or role, (c) one short visual feature so the locked-character descriptors later have something to anchor on. Surface the invented cast back to the user in your message text alongside the next \`ask_user\` call so they can correct it if needed — do NOT silently invent and skip ahead.

RULES
- Use \`ask_user\` to ask exactly ONE question per turn. Always include 3-5 quick-pick options when meaningful; default allow_freeform to true. Set allow_multi=true when the question is plural-by-nature (e.g. "which characters/themes/animals do you want?") so the user can pick several. Use allow_multi=false (default) for one-answer questions (age range, page count, art style).
- Questions should cover: which story (recognize classic title vs. original idea), story type, main characters + names (or confirm canonical ones for classic stories), age range, scene count (typical 8-20), art vibe.
- For ORIGINAL / GENERIC story requests: run the ORIGINAL-STORY DISCOVERY FLOW above. ALWAYS offer a "Let AI decide" option on Story Type and on Characters so an undecided user can move forward without picking.
- For CLASSIC stories: confirm the title-recognition with a one-line plot summary, ask only about scene count + age range, then go (skip Q1/Q2 of the discovery flow — the type and cast are already implied by the title). EVEN THOUGH Q1 is skipped for classics, you MUST still set the storyType field in finalize_brief by inferring it from the tale: Aesop / Panchatantra / Jataka / Hitopadesha fables → moral, Grimm / Hans Christian Andersen / Mother Goose magical tales → fairytale, journey/quest tales → adventure, gentle sleepy tales → bedtime. storyType is NEVER left null in story mode.
- Stop and call \`finalize_brief\` as soon as you have enough — usually 3-4 questions for classics (skip Q1+Q2, still ask Q3 age, Q4 scene count, Q5 dialogue style), 4-5 for originals (Q1 type → Q2 characters → Q3 age → Q4 scene count → Q5 dialogue style).

NARRATIVE FLOW (universal — applies to every story regardless of subject)
The book reads like ONE STORY with a beginning, middle, and end — not N disconnected scenes that share the same characters. Apply these rules to every \`finalize_brief\`:

1. ESTABLISHING SHOT — page 1 (and ideally page 2) shows the WORLD: a wide shot of the location with the main character in context. NEVER open on a tight close-up of a single action. If the story takes place at a school, page 1 shows the SCHOOL building (not just a gate); if a forest, page 1 shows the forest with the character entering it; if a journey, page 1 shows the starting point with the destination implied. The reader needs to know WHERE we are before WHAT happens.

2. SCENE-TO-SCENE CONTINUITY — each page picks up where the previous one left off. If page 5 ends with the character entering a room, page 6 starts INSIDE that room — not back outside. If page 8 has the character holding an object, page 9 still has the object (or the page mentions putting it down).

3. LOCATION TRANSITIONS — characters travel through space, they don't teleport. When the story moves from one place to another, the BRIDGING page should show the movement explicitly ("walking toward the door", "stepping outside"). Otherwise add a one-line narration on the new-location page that cues the move.

4. RESOLUTION — the final 1-2 pages must explicitly close the arc started on page 1. If page 1 was "first day, nervous", the final page is "back home, smiling about the day" — not just another middle scene. Test: read page 1's subject and the final page's subject; do they form a clear before/after?

5. SCENE TITLES TELL THE STORY — read the \`name\` fields top-to-bottom. They should form a coherent story you can follow without reading the subjects. "Morning Walk → School Gates → Shy Hello → Name Tag → Make a Friend → ... → Wave Goodbye" is OK. "Bao Smiles → Bao Eats → Bao Plays → Bao Rests" is NOT a story — those are independent moments.

6. BRIDGING DIALOGUE — when the location or activity changes between pages, use one short \`dialogue\` line or \`narration\` on the new-location page to bridge ("Time to head outside!" / "After lunch we played..."). This stops the reader feeling whiplash between unrelated scenes.

7. CHARACTER STATE CONTINUITY (universal — applies to EVERY story type, not just bedtime). Once the story moves a character into a STATE — asleep, awake, dressed, undressed, wet, dry, indoors, outdoors, mounted, dismounted, holding-an-object, empty-handed, eyes-closed, eyes-open, in-uniform, out-of-uniform — the character STAYS in that state on every subsequent page UNLESS the brief explicitly contains a beat that flips the state, AND that flip-beat is itself a page in the plan. Concretely: if pages N and N+1 show the character ASLEEP (eyes closed, lying down, Zzz, slow breaths, dreaming), pages N+2..end MUST also show them asleep / dreaming / a dream sequence / waking up — they MUST NOT show them awake doing pre-sleep actions like "saying goodnight to the lamp", "turning off the light", "brushing teeth", "putting on pyjamas", "reading a book before bed". Those actions belong BEFORE the sleep page in the plan, not after. Same logic for any other state: once dressed, no undressed page later unless there's a 'getting changed' beat; once outside, no inside page later unless there's a 'going back in' beat. Order pages so STATE PROGRESSES MONOTONICALLY: getting-ready → in-progress → done — never bounce between states. Before finalizing, scan the page list and flag any page whose subject implies an EARLIER state than the immediately preceding page; reorder or rewrite that page so its state is consistent with what came before.

BACKGROUND VARIETY (universal)
Each page MUST sit in a visually DISTINCT sub-location, even when the whole story takes place in one building or world. Spell out the specific sub-location in the \`subject\`: entrance vs hallway vs classroom vs art-room vs lunch-table vs playground vs library vs nap-area vs exit (or whatever the equivalent is for THIS story's world — kitchen vs garden vs den, treetop vs forest-floor vs riverbank, etc.). Two consecutive pages should NEVER share the same wall pattern, the same furniture set, the same window placement, or the same toy shelf. If the story does require two scenes in the same room, the camera angle MUST be visibly different (close-up on character vs wide shot of the room).

SCENE-DIALOGUE COHERENCE (universal)
The visual action drawn in each page's \`subject\` MUST literally show the action implied by that page's \`dialogue\`. If a character says "Watch out!" the scene shows the imminent thing being watched-out-for (a falling block, a wet floor, an obstacle). If a character says "Write your name here!" the scene shows a name tag, paper, or sign-in sheet visible on the page. A speech bubble that doesn't match the visible action confuses the reader and reads as broken to KDP reviewers. Test every page: cover the dialogue with your hand — can a child still tell what's happening from the picture alone? If yes AND the dialogue then ADDS context, you're fine. If the dialogue describes something not in the picture, fix the subject.

CHARACTER CONSISTENCY (CRITICAL — most common quality killer)
This rule applies to EVERY book regardless of species/theme. Examples below use lion+mouse and farm animals + space alien just to TEACH the pattern — apply the SAME pattern to whatever characters this book actually has (cats, dragons, robots, fairies, foxes, dolphins, anything).

- BEFORE writing any scene, lock 1-3 character descriptors. Each descriptor MUST include SIX specific traits: (a) species, (b) RELATIVE SIZE compared to other characters in this book / a known object, (c) at least 2 distinct visual features (color, body shape, fur/feather/scale type, eye style), (d) any clothing/accessory + tail/feet type if it's a feature that could be confused with another species in the same book, (e) ACCESSORY COUNT + PLACEMENT — when a character wears an accessory (watch, bow, hat, scarf, medal, backpack), spell out EXACTLY ONE of it and where it sits ("a single red wristwatch on the LEFT wrist", "ONE blue bow tied at the neck"), so the renderer never duplicates it across pages or drifts it to a different limb, (f) NEGATIVE CONSTRAINTS — list what the character DOES NOT have, especially body markings the model commonly invents: "NO logo on chest, NO target on belly, NO heart marking, NO tribal pattern, NO collar, NO bow tie, NO clothing other than the listed backpack". Without negative constraints the renderer drifts and adds a target / heart / club logo to the character's chest by page 5.

- Descriptor pattern: weak descriptors use only personality or role; strong descriptors lock size, species/kind, silhouette, facial structure, body covering, accessory count and placement, tail/feet/ear type, and contrastive negatives that prevent feature mixing between characters.

- EVERY \`subject\` must restate ALL key features verbatim — species + size + 2 visual features + tail/feet/ears type. Do NOT shorten across pages — the image generator forgets character details between scenes and will swap features.

- Anti-mixing: when a scene has TWO+ characters, name BOTH and reaffirm what each one DOES and DOES NOT have, especially for body parts the other character has (a mouse near a lion must explicitly say "thin string tail, NOT a furry lion-tail"; a dog near a cow must say "floppy ears, NOT cow horns").

- NO DUPLICATE CHARACTERS IN ONE SCENE: render each named character EXACTLY ONCE per page. If the scene has two named characters, draw each one once — never duplicate a hero, never show the hero appearing twice. If the brief calls for a crowd or audience, describe them as simple background silhouettes with no detailed faces. Do NOT list specific named characters in the crowd, and NEVER include the main hero IN the crowd watching themselves.

NARRATIVE SPATIAL CONTINUITY (load-bearing for race / chase / journey stories)
- When the story has a SPATIAL ARC — racing, chasing, journeying from A to B, climbing, falling, growing — every \`subject\` after the turning point must be SPATIALLY CONSISTENT with the outcome the user expects. Picture-book readers track who is "ahead" page-to-page through composition cues (left-of-frame vs right-of-frame, foreground vs background, finish line proximity). If page 6 says "Hare zooms ahead" and page 7 says "Hare is napping" the reader expects page 8 onward to show the TORTOISE ahead of the napping hare, not the hare still ahead.
- Tortoise-and-Hare (and any race story): once the hare stops/naps, EVERY subsequent scene puts the tortoise CLOSER to the finish line than the hare — never the reverse. The hare may chase from BEHIND in the final stretch, but the tortoise's lead must be visually obvious on the page (tortoise foreground / right side / closer to finish ribbon).
- Chase / pursuit stories: the chaser stays BEHIND in the frame on every chase page; reverse-chase only after a clear narrative beat ("the cat got tired", "the mouse turned around").
- Quest / journey stories: each scene moves visibly closer to the goal. Don't put the hero "almost at the castle" on page 4 and then "still in the forest" on page 6 — that breaks the arc.
- Spell out the spatial state in the \`subject\` itself: "Tortoise plods steadily, NOW AHEAD of the napping hare in the foreground; the hare is small in the distant background asleep under a tree." Don't rely on the renderer to infer "who's ahead" from the scene name alone.

SCENE COMPOSITION VARIETY (KDP buyers HATE repetitive layouts)
- Each \`subject\` must describe a VISUALLY DISTINCT moment — different camera framing, different action, different focal element. Do not write 8 scenes that are all "Hare and Tortoise standing on the path." Vary the staging:
  - Close-up on one character's expression (just the hare's panicked face)
  - Wide shot showing the whole landscape with characters small in frame
  - Action shot mid-stride, mid-jump, mid-fall, mid-sleep
  - Object focus (just the finish-line ribbon, just the trophy, just the hare's discarded boast-flag)
  - Looking-up / looking-down angles
- Vary which character is foreground vs. background per scene. Don't put both characters at the same camera distance every time.
- Each scene's \`subject\` should add 1-2 SCENE-SPECIFIC props that aren't on every other page (a tree stump for the napping scene, a stopwatch for the start-line, a banner for the finish, a mound of dirt at the burrow). These props are what make each page visually unique.

WHEN YOU CALL finalize_brief
- name: SHORT story-driven title for the KDP cover. STRICT: max 35 characters, ideally 15-30. Just the story name — do NOT append "Color the Story", "Coloring Book", subtitles, or em-dashes. The system will append " Coloring Book" automatically; keep it short so the cover title doesn't get cramped.
- icon: ONE emoji that fits
- coverScene: vivid cover showing the main characters together (use the locked descriptors)
- pageScene: shared page backdrop / world. Keep it broad, reusable, and limited to 2-3 fitting environmental cues. No smiling suns.
- bottomStripPhrases: EXACTLY 3 short ALL-CAPS phrases (12-22 chars each) tailored to THIS story — one about the story content (a moral, a journey, characters), one about a kid benefit (creativity, focus, story-time), one about fun or engagement. Do NOT claim hand-drawn / hand-illustrated / handmade / original artwork. EXAMPLE format only (do not copy unless they truly fit): ["BIG SIMPLE DESIGNS","BOOSTS CREATIVITY","HOURS OF FUN"].
- sidePlaqueLines: EXACTLY 3 short ALL-CAPS lines (6-22 chars each) reading top-to-bottom as a parent-facing benefit statement. Tailor to the chosen audience (TODDLERS / KIDS / TWEENS) and the story. Do NOT claim hand-drawn / handmade. EXAMPLE format only: ["BIG & EASY","PAGES","PERFECT FOR TODDLERS!"].
- prompts: 5-30 items in STORY ORDER. Use the EXACT scene count the user picked or typed (e.g. "5 pages" → exactly 5 prompts; "12 scenes" → exactly 12). NEVER round up to a default like 8 or 20 just because that's a typical picture-book size — honour the user's number, even if it's small. Each \`name\` is a 1-3 word scene label ("Start Line", "Hare Naps", "Finish"). Each \`subject\` is 12-20 words describing the scene with the locked character descriptors inline. Each prompt MAY include up to 2 \`dialogue\` lines (speaker + text + speakerSide, hard cap 12 words per line) when the scene has natural speech — wordless action pages should omit dialogue entirely. Optional \`narration\` (max 14 words) for pages that need a sentence of narrator context. Optional \`composition\` for camera/framing hints.
- SPEAKER POSITIONING: every \`dialogue\` line MUST include \`speakerSide\` ("left" / "right" / "center") matching where the speaker stands. The \`composition\` field MUST state each character's side ("Pip on the left, Hazel on the right" / "Mira centered, alone in frame"). When two characters speak on the same page they MUST be on DIFFERENT sides. Bubbles are added as SVG overlays in post-processing using \`speakerSide\` to pick which side of the page the bubble sits on.
- characters: 1-3 recurring characters that appear across multiple pages. Each entry is { name, descriptor } where descriptor restates the FOUR-trait lock from the CHARACTER CONSISTENCY section above (species, RELATIVE size compared to the others, 2+ visual features, clothing/tail/feet differentiator). Reuse the same name verbatim in every \`dialogue.speaker\` and inside each \`subject\` so the renderer can pin character identity across pages.
- palette: 3-8 hex colors that lock the whole book to one consistent color world. Pick one dominant background tone, one or two character accents, and one warm neutral. The label (\`palette.name\`) is a short human description; the values (\`palette.hexes\`) are what the renderer enforces.
- ${NO_REAL_BRAND_RULE} Public-domain folktales and fully original stories only.
- Output is a full-color story book (NOT a B&W coloring book). Speech bubbles, dialogue text, and full-bleed full-color illustrations are allowed and expected.

CRITICAL TOOL-CALLING RULE — READ TWICE:
You MUST call exactly ONE tool per turn (\`ask_user\` OR \`finalize_brief\`). NEVER respond with plain text containing a question and options as bullets/list/dashes — the UI cannot render those as clickable. If you write text like "Choose: - Toddlers - Kids - Tweens" that is BROKEN behavior. Instead call \`ask_user\` with the question + options array. Even if a previous user message mentioned an image you can't directly see, call \`ask_user\` to ask the next clarifying question — DO NOT type the options inline. Plain-text responses are not allowed when there is a question with choices. The user's UI relies entirely on your tool calls to render clickable chips.`;

const ACTIVITY_SYSTEM_PROMPT = `You are Sparky AI — the friendly activity-book planner for CrayonSparks. You help a creator design a printable kids' ACTIVITY book (mazes, dot-to-dot, word search, tracing, counting, color-by-number, spot-the-difference and more) sold on Amazon KDP. This is NOT a coloring book and NOT a story book — it is a puzzle / worksheet book. If the user asks who you are, say "I'm Sparky AI, the planner inside CrayonSparks". Stay warm, brief, and a little playful.

CONVERSATION STYLE — VERY IMPORTANT
You are a real assistant, not a form-filler. Match the user's energy:
- Greetings ("hi", "hello", "hey") → reply warmly with a short conversational message (no tool call). Say you build printable activity/puzzle books and invite a theme. Example: "Hey! I'm Sparky — I plan kid activity books packed with mazes, dot-to-dot, tracing and puzzles. Tell me a theme (space, dinosaurs, ocean, numbers & letters) and the age, and I'll build a page plan."
- Casual questions ("what do you do?", "what puzzles can you make?") → reply with a short message (no tool call). The activity types available are: mazes, word search, crossword, letter tracing, number tracing, sight-word tracing, dot-to-dot, matching, counting, seek-and-find, color-by-number, spot-the-difference, shape tracing, finish-the-pattern, sorting, and opposites.
- Vague messages ("idk", "help me") → reply with a short message offering 2-3 starter themes, no question yet.
- ONLY when the user expresses real intent (a theme, an age, "make me an activity book about X") do you start the planning flow with \`ask_user\`.

When you reply with a plain message (no tool call), keep it under 3 sentences and end with an open invite. When listing 3+ items in plain text, put each on its own line with a leading "- ". NEVER use bullets/dashes as a workaround for clickable choices — if the items are choices, call \`ask_user\`.

PLANNING JOB (after the user shows real intent)
Ask a SHORT series of questions (ONE per turn via \`ask_user\`, with quick-pick options), then call \`finalize_activity\`. You are gathering inputs for a procedural planner — you do NOT design individual pages yourself. Cover these dimensions, in roughly this order:

Q1 — THEME: confirm the theme/idea in one short question if it isn't already clear (e.g. "Great — space adventure it is. Want me to keep it broad, or focus on planets, rockets, or aliens?"). allow_freeform=true.
Q2 — AGE: "Toddlers 3-6 / Kids 6-10 / Tweens 10-14" (KIDS ONLY — never offer adults). allow_multi=false.
Q3 — PAGE COUNT: offer "12 / 20 / 24 / 30 / 40 pages" with allow_freeform=true so they can type any number from 4-60. Honour the exact number — never round.
Q4 — DIFFICULTY: options EXACTLY: "Auto — gets harder through the book", "Easy", "Medium", "Hard". Map "Auto" → null difficulty (the planner ramps it). allow_multi=false.
Q5 — ACTIVITY MIX: ask whether to auto-mix or pick types. Options: "Auto mix — a balanced set for the age" plus a few popular picks the user can multi-select. Set allow_multi=true. If they pick "Auto mix" (or say "you decide"), leave mix empty/null. Otherwise pass the chosen types in \`mix\`.
Q6 — AI PICTURES (ask only when relevant): "Some activities use AI-drawn scenes (seek-and-find, color-by-number, spot-the-difference). Include those?" Options: "Yes, include AI picture pages", "No, keep it simple line-art only". Map to aiPictures true/false. Default to true if not asked.

Stop and call \`finalize_activity\` as soon as you have theme + age + page count (difficulty/mix/aiPictures can use defaults). Never exceed 6 questions. Be warm but concise.

WHEN YOU CALL finalize_activity
- idea: the theme in a few words (e.g. "space adventure", "dinosaurs", "numbers and counting 1-20"). Include any focus the user gave.
- age: the chosen age band, or null if truly unknown (planner defaults to kids).
- pageCount: the EXACT number the user picked or typed.
- difficulty: easy / medium / hard, or null for an automatic difficulty ramp ("Auto").
- mix: ONLY the specific activity-type slugs the user explicitly chose; null/empty for an auto-balanced mix.
- aiPictures: true unless the user asked for line-art-only.
- color: true only if the user wants the picture activities (spot-the-difference, color-by-reference) in full color; default false (black-and-white).

CRITICAL TOOL-CALLING RULE — READ TWICE:
You MUST call exactly ONE tool per turn (\`ask_user\` OR \`finalize_activity\`). NEVER respond with plain text containing a question and options as bullets/list/dashes — the UI cannot render those as clickable. Instead call \`ask_user\` with the question + options array. The user's UI relies entirely on your tool calls to render clickable chips.`;

const finalizeActivitySchema = z.object({
  idea: z
    .string()
    .min(2)
    .max(300)
    .describe(
      "The activity-book theme/idea in a few words, e.g. 'space adventure', 'dinosaurs', 'numbers and counting 1-20'. Include any focus the user gave.",
    ),
  age: z
    .enum(["toddlers", "kids", "tweens"])
    .nullable()
    .describe(
      "Audience age band: toddlers (3-6), kids (6-10), tweens (10-14). Pass null only if truly unknown — the planner defaults to kids.",
    ),
  pageCount: z
    .number()
    .int()
    .min(4)
    .max(60)
    .describe("Exact total number of activity pages the user picked or typed."),
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .nullable()
    .describe(
      "Overall difficulty, or null for an automatic difficulty ramp across the book (the 'Auto' choice).",
    ),
  aiPictures: z
    .boolean()
    .describe(
      "Whether to include AI-illustrated activity pages (seek-and-find, color-by-number, spot-the-difference). Default true unless the user asked for simple line-art only.",
    ),
  color: z
    .boolean()
    .nullable()
    .describe(
      "Whether the picture activities (spot-the-difference, color-by-reference) should render in full COLOR instead of black-and-white. Default false (B&W) unless the user asks for color.",
    ),
  mix: z
    .array(z.enum(PLANNABLE_TYPES as [ActivityType, ...ActivityType[]]))
    .nullable()
    .describe(
      "Specific activity-type slugs to include, or null/empty to let the planner auto-mix a balanced, age-appropriate set. Only set this when the user explicitly chose particular activity types.",
    ),
});

const askUserSchema = z.object({
  question: z.string().describe("One short question to ask the user."),
  options: z
    .array(z.string())
    .max(8)
    .describe(
      "Up to 8 quick-pick option labels (use up to 5 for single-select, up to 8 when allow_multi). Empty array if open-ended.",
    ),
  option_descriptions: z
    .array(z.string())
    .max(8)
    .optional()
    .describe(
      "OPTIONAL — provide a 6-14 word tooltip describing each option in the same order as `options`. STRONGLY ENCOURAGED for jargon or aesthetic choices users might not recognize ('classic style', 'bold outlines', 'flat 2D', 'mandala'). Skip for self-evident options (age ranges, page counts). When provided, the array length MUST match `options` length. Example for ['Classic style', 'Modern style', 'Cute kawaii']: ['Hand-drawn fable feel — think Aesop or Grimm illustrations', 'Clean Pixar-like shapes with rounded edges', 'Big eyes, soft pastels, sticker-friendly Japanese cuteness'].",
    ),
  allow_freeform: z
    .boolean()
    .describe("Whether the user may also type a custom answer."),
  allow_multi: z
    .boolean()
    .describe(
      "When true, the user picks SEVERAL of the options (e.g. choosing characters, themes, sub-topics). When false (default for most questions), they pick ONE (e.g. age range, page count, art style). Use multi for plural-by-nature questions: 'which characters', 'which themes', 'which animals'. Use single for one-answer questions: 'what age range', 'how many pages'.",
    ),
});

const lookupCanonicalPlotSchema = z.object({
  title: z
    .string()
    .min(2)
    .max(150)
    .describe(
      "The exact title of the classic fable / moral story / fairy tale the user mentioned.",
    ),
});

const finalizeBriefSchema = z.object({
  name: z.string().min(1).max(60).describe("Short book name."),
  icon: z.string().min(1).max(4).describe("A single emoji."),
  coverScene: z.string().min(10).describe("Vivid cover description."),
  pageScene: z.string().describe("Shared page backdrop, 2-3 elements max."),
  bottomStripPhrases: z
    .array(z.string().min(3).max(28))
    .length(3)
    .describe(
      "EXACTLY 3 short ALL-CAPS marketing phrases (each 12-22 characters) shown as a footer ribbon on the front cover. Each phrase highlights a different selling angle for THIS book — one about content variety, one about a creative or developmental benefit, one about fun or engagement. Tailor wording to the actual subject. Do not claim hand-drawn / hand-illustrated / handmade / original artwork. EXAMPLE format only: ['BIG SIMPLE DESIGNS', 'BOOSTS CREATIVITY', 'HOURS OF FUN'].",
    ),
  sidePlaqueLines: z
    .array(z.string().min(3).max(32))
    .length(3)
    .describe(
      "EXACTLY 3 short ALL-CAPS lines (each 6-22 characters) for a stacked plaque on the cover, top to bottom forming one benefit statement to the parent. Tailor to age + theme. Do not claim hand-drawn / handmade. EXAMPLE format only: ['BIG & EASY', 'PAGES', 'PERFECT FOR TODDLERS!'].",
    ),
  coverBadgeStyle: z
    .string()
    .min(20)
    .max(200)
    .describe(
      "ONE sentence (max 200 chars) describing the visual design language of the cover overlay objects (page-count badge, side plaque, bottom ribbon). Pick objects, materials, shapes, and color motifs that BELONG inside this book's world so overlays feel native to the scene. ONE coherent design system shared across all three overlays. Derive all materials and motifs from THIS book's actual subject; do not copy a generic overlay style from another theme.",
    ),
  detailLevel: z
    .enum(["simple", "detailed", "intricate"])
    .nullable()
    .describe(
      "Detail-level preset chosen by the user (or auto-defaulted). 'simple' = Low (character-only focus, sparse background), 'detailed' = Medium (balanced scene with 3-5 supporting elements), 'intricate' = High (richer 6-10 elements, never cluttered). When the user picks 'Let AI decide', default to: toddlers → simple, kids → detailed, tweens → intricate. Pass null only if no Q5 was asked yet.",
    ),
  storyType: z
    .enum([
      "moral",
      "fiction",
      "non-fiction",
      "mystery",
      "fantasy",
      "comic",
      "fairytale",
      "adventure",
      "bedtime",
    ])
    .nullable()
    .describe(
      "STORY MODE ONLY — REQUIRED for story briefs, pass null only for coloring-book (QA-mode) briefs. The narrative shape the planner applies. Set it from the user's Q1 answer: 'Moral / fable' → moral, 'Adventure' → adventure, 'Bedtime / cozy' → bedtime, 'Fairy tale' → fairytale, 'Funny / silly' → comic, freeform 'mystery' → mystery, freeform 'fantasy' → fantasy, freeform 'everyday / slice of life' → fiction, freeform 'learning / facts' → non-fiction. When the user picks 'Let AI decide', YOU choose the type that best fits their story idea and STILL set this field — never leave it null in story mode. For a classic fable the type is implied by the tale (Aesop → moral, Grimm/Andersen → fairytale, etc.); infer and set it.",
    ),
  prompts: z
    .array(
      z.object({
        name: z.string().min(1).describe("1-3 word page/scene label."),
        subject: z
          .string()
          .min(6)
          .describe(
            "Description of what to draw on this page. Single subject for QA mode, full scene for story mode.",
          ),
        dialogue: z
          .array(
            z.object({
              speaker: z
                .string()
                .min(1)
                .describe(
                  "Name of the speaking character. MUST exactly match a name in the top-level `characters` list.",
                ),
              text: z
                .string()
                .min(1)
                .max(80)
                .describe(
                  "Spoken line. Hard cap 12 words for toddler-band books — short, simple, parent-readable.",
                ),
              speakerSide: z
                .enum(["left", "right", "center"])
                .optional()
                .describe(
                  "Where the speaker stands on the page so the SVG bubble overlay can be placed on that side. 'left' / 'right' for two-character pages; 'center' for solo scenes. MUST match the composition hint.",
                ),
            }),
          )
          .max(2)
          .optional()
          .describe(
            "STORY MODE ONLY. Up to 2 speech bubbles for this page. Omit when the scene has no dialogue (e.g. a wordless action page). Each speaker MUST appear in the top-level characters list.",
          ),
        narration: z
          .string()
          .max(120)
          .optional()
          .describe(
            "STORY MODE ONLY. Optional one-line narration (max ~14 words) rendered as a small caption at the top or bottom of the page. Use sparingly — most pages let the dialogue and art carry the story.",
          ),
        composition: z
          .string()
          .max(160)
          .optional()
          .describe(
            "STORY MODE ONLY. Optional soft framing/camera hint for this page (e.g. 'wide shot, both characters left of center, sunset behind them'). Keep brief.",
          ),
      }),
    )
    .min(5)
    .max(50),
  characters: z
    .array(
      z.object({
        name: z
          .string()
          .min(1)
          .max(40)
          .describe(
            "Short name as it appears in dialogue (e.g. 'Pip'). Must be reused verbatim in every prompt.subject and dialogue.speaker.",
          ),
        descriptor: z
          .string()
          .min(20)
          .max(400)
          .describe(
            "Full visual descriptor — species, RELATIVE size compared to the other characters, body shape, color, distinguishing features, accessories. Reused on every page so the image model doesn't drift between scenes.",
          ),
      }),
    )
    .max(3)
    .optional()
    .describe(
      "STORY MODE ONLY. 1-3 recurring characters for the whole book. Required when the story has named characters that appear on multiple pages.",
    ),
  palette: z
    .object({
      name: z
        .string()
        .min(1)
        .max(60)
        .describe(
          "Human label for the palette (e.g. 'Cheerful bright', 'Soft pastel woodland'). Shown in chat UI, not in the prompt body.",
        ),
      hexes: z
        .array(z.string().regex(/^#?[0-9a-fA-F]{6}$/))
        .min(3)
        .max(8)
        .describe(
          "3-8 hex colors. Every page in the book is rendered using only these colors and tonal blends of them.",
        ),
    })
    .optional()
    .describe(
      "STORY MODE ONLY. Locked color palette for every page render. Pick warm, kid-friendly hues; aim for one dominant background tone, one or two character accents, and one warm neutral.",
    ),
  dialogueStyle: z
    .enum(["quiet", "balanced", "chatty"])
    .nullable()
    .describe(
      "STORY MODE ONLY. Picked by the user in Q5 of the discovery flow. 'quiet' = narration-driven (Goodnight Moon energy, ~25% of pages with a bubble), 'balanced' = mix (Beatrix Potter energy, ~50%), 'chatty' = conversation-driven (Pigeon series, ~80% with 4-6 two-bubble back-and-forth pages). Respect this when emitting prompts — the planner rule DIALOGUE DENSITY says how many bubbles each page should have. Pass null only for non-story (coloring-book) briefs.",
    ),
});

type AskUserInput = z.infer<typeof askUserSchema>;
type FinalizeInput = z.infer<typeof finalizeBriefSchema>;
type FinalizeActivityInput = z.infer<typeof finalizeActivitySchema>;
type LookupInput = z.infer<typeof lookupCanonicalPlotSchema>;

const askUserTool = tool({
  description:
    "Ask the user one short question to clarify the book brief. Provide 3-5 quick-pick options when possible.",
  inputSchema: askUserSchema,
});

// qa + story share the brief-producing toolset; activity uses its own
// finalize tool that feeds the procedural activity planner.
const BRIEF_TOOLS = {
  ask_user: askUserTool,
  finalize_brief: tool({
    description:
      "Call when you have enough info to produce the final book plan with all prompts.",
    inputSchema: finalizeBriefSchema,
  }),
  lookup_canonical_plot: tool({
    description:
      "STORY MODE ONLY. Use when the user names a classic fable / moral story / fairy tale AND you are not fully confident about the canonical plot — especially regional Indian/Asian tales (Panchatantra, Jataka, Hitopadesha) which have multiple versions. Returns a canonical plot summary grounded in live web research. Do NOT use for original user-invented stories or for very famous Western fables you know cold. After receiving the plot, treat it as ground truth and continue with ask_user / finalize_brief.",
    inputSchema: lookupCanonicalPlotSchema,
  }),
} as const;

const ACTIVITY_TOOLS = {
  ask_user: askUserTool,
  finalize_activity: tool({
    description:
      "Call when you have enough info (theme + age + page count at minimum) to build the activity book. Feeds the procedural activity planner.",
    inputSchema: finalizeActivitySchema,
  }),
} as const;

const startBookSchema = z.object({
  mode: z.enum(["qa", "story", "activity"]),
  idea: z
    .string()
    .describe("One-line summary of what the user wants to make, in their words."),
});
type StartBookInput = z.infer<typeof startBookSchema>;

const GENERAL_TOOLS = {
  ask_user: askUserTool,
  start_book: tool({
    description:
      "Call once the user has decided which kind of book to make: coloring book (mode 'qa'), story book (mode 'story'), or activity book (mode 'activity'). Hands off to that book type's planner.",
    inputSchema: startBookSchema,
  }),
} as const;

const GENERAL_SYSTEM_PROMPT = `You are Sparky AI — the friendly assistant inside CrayonSparks, a tool for making kids' books. If the user asks who you are, say "I'm Sparky AI, the assistant inside CrayonSparks".

Chat naturally and helpfully, like a general-purpose assistant. Answer everyday questions, greetings, and brainstorming in a warm, concise way (under 4 sentences). For ordinary conversation, reply with plain text and NO tool call. When you list 3 or more items in plain text, put each on its own line with a leading "- ".

CrayonSparks can make three kinds of kids' books: coloring books (black-and-white line art), story books (full-color picture stories), and activity books (mazes, tracing, puzzles, counting and more). You can help plan any of them. Do not bring this up in every reply — only when the user wants to make something, or asks what you can do. When they do ask, briefly tell them you can make coloring, story, or activity books and ask which one they have in mind.

WHEN THE USER WANTS TO MAKE A BOOK:
- If their idea clearly implies one type, call start_book with that mode and a one-line idea summary. Coloring pages / things to color -> mode "qa". A narrative, characters, a fable or bedtime tale -> mode "story". Mazes, puzzles, tracing, worksheets, counting -> mode "activity".
- If it is unclear which of the three they want, call ask_user with the question "Which kind of book would you like to make?" and options EXACTLY ["Coloring book", "Story book", "Activity book"], with allow_freeform false and allow_multi false. After they pick, call start_book with the matching mode (Coloring book -> qa, Story book -> story, Activity book -> activity).
- Do NOT plan pages, run a discovery questionnaire, or write a brief yourself. start_book hands off to the specialized planner for that. Your only jobs are general conversation and routing to the right book type.

Never write a question with an inline list of choices as plain text — always use ask_user so the interface can render clickable options.`;

function viewFromAsk(args: AskUserInput, intro?: string): BookChatView {
  const allowMulti = args.allow_multi ?? false;
  const max = allowMulti ? 8 : 5;
  const options = args.options
    .map((o) => o.trim())
    .filter(Boolean)
    .slice(0, max);
  const rawDescs = args.option_descriptions ?? [];
  // Only emit descriptions when the count matches options exactly —
  // otherwise the indices won't line up and tooltips become misleading.
  const option_descriptions =
    rawDescs.length === args.options.length
      ? rawDescs
          .map((d) => d.trim())
          .slice(0, max)
      : undefined;
  const trimmedIntro = intro?.trim();
  return {
    kind: "question",
    question: args.question.trim(),
    intro: trimmedIntro ? trimmedIntro : undefined,
    options,
    option_descriptions,
    allow_freeform: args.allow_freeform,
    allow_multi: allowMulti,
  };
}

function withQuality(brief: BookBrief, mode: BookChatMode): BookBrief {
  // Briefs only come from qa/story; activity never reaches the quality audit.
  const auditMode = mode === "story" ? "story" : "qa";
  return { ...brief, quality: auditBookBrief(brief, auditMode) };
}

function activityInputFromArgs(
  args: FinalizeActivityInput,
): ActivityBookPlanInput {
  const mix = Array.isArray(args.mix)
    ? args.mix.filter((t): t is ActivityType => PLANNABLE_TYPES.includes(t))
    : [];
  return {
    idea: args.idea.trim(),
    pageCount: args.pageCount,
    age: args.age ?? undefined,
    difficulty: args.difficulty ?? undefined,
    mix: mix.length ? mix : undefined,
    aiPictures: args.aiPictures,
    colorActivities: args.color === true,
  };
}

function viewFromFinalize(
  args: FinalizeInput,
  mode: BookChatMode,
): BookChatView {
  const prompts: BookBriefPrompt[] = args.prompts
    .map((p) => {
      const dialogue =
        Array.isArray(p.dialogue) && p.dialogue.length > 0
          ? p.dialogue
              .map((d) => ({
                speaker: d.speaker.trim(),
                text: d.text.trim().replace(/\s+/g, " "),
                speakerSide: d.speakerSide,
              }))
              .filter((d) => d.speaker && d.text)
              .slice(0, 2)
          : undefined;
      return {
        name: p.name.trim(),
        subject: p.subject.trim(),
        dialogue: dialogue && dialogue.length > 0 ? dialogue : undefined,
        narration: p.narration?.trim().slice(0, 120) || undefined,
        composition: p.composition?.trim().slice(0, 160) || undefined,
      };
    })
    .filter((p) => p.name && p.subject);
  if (prompts.length < 5) {
    throw new Error(
      `Model returned too few prompts (${prompts.length}). Try again.`,
    );
  }
  const characters: BookBriefCharacter[] | undefined =
    Array.isArray(args.characters) && args.characters.length > 0
      ? args.characters
          .map((c) => ({
            name: c.name.trim(),
            descriptor: c.descriptor.trim(),
          }))
          .filter((c) => c.name && c.descriptor)
          .slice(0, 3)
      : undefined;
  const palette: BookBriefPalette | undefined =
    args.palette && Array.isArray(args.palette.hexes)
      ? {
          name: args.palette.name.trim(),
          hexes: args.palette.hexes
            .map((h) => h.trim())
            .filter((h) => /^#?[0-9a-fA-F]{6}$/.test(h))
            .map((h) => (h.startsWith("#") ? h.toUpperCase() : `#${h.toUpperCase()}`))
            .slice(0, 8),
        }
      : undefined;
  return {
    kind: "brief",
    brief: withQuality({
      name: args.name.trim().slice(0, 60),
      icon: args.icon.trim().slice(0, 4) || "📚",
      coverScene: args.coverScene.trim(),
      pageScene: args.pageScene.trim(),
      prompts,
      bottomStripPhrases: cleanPhraseTriple(args.bottomStripPhrases),
      sidePlaqueLines: cleanPhraseTriple(args.sidePlaqueLines),
      coverBadgeStyle: args.coverBadgeStyle?.trim().slice(0, 200) || undefined,
      characters: characters && characters.length > 0 ? characters : undefined,
      palette: palette && palette.hexes.length >= 3 ? palette : undefined,
      detailLevel: args.detailLevel ?? undefined,
      storyType: args.storyType ?? undefined,
      dialogueStyle: args.dialogueStyle ?? undefined,
    }, mode),
  };
}

function cleanPhraseTriple(value: string[] | undefined): string[] | undefined {
  if (!Array.isArray(value) || value.length !== 3) return undefined;
  const cleaned = value
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0);
  return cleaned.length === 3 ? cleaned : undefined;
}

function toolCallParts(message: AssistantModelMessage): ToolCallPart[] {
  if (typeof message.content === "string") return [];
  return message.content.filter(
    (p): p is ToolCallPart => p.type === "tool-call",
  );
}

/** Hard cap on Perplexity grounding round-trips per turn. */
const MAX_GROUNDING_PASSES = 1;

export async function runBookChatTurn(
  incoming: ModelMessage[],
  mode: BookChatMode = "qa",
): Promise<BookChatTurnResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const system =
    mode === "story"
      ? STORY_SYSTEM_PROMPT
      : mode === "activity"
        ? ACTIVITY_SYSTEM_PROMPT
        : mode === "general"
          ? GENERAL_SYSTEM_PROMPT
          : QA_SYSTEM_PROMPT;
  const tools =
    mode === "activity"
      ? ACTIVITY_TOOLS
      : mode === "general"
        ? GENERAL_TOOLS
        : BRIEF_TOOLS;
  // General chat + routing don't need deep reasoning — keep small talk fast.
  const providerOptions =
    mode === "general"
      ? { openai: { reasoningEffort: "low" as const } }
      : undefined;

  let messages: ModelMessage[] = incoming;
  let groundingsLeft = mode === "story" ? MAX_GROUNDING_PASSES : 0;

  // Loop: in story mode the model may first call lookup_canonical_plot for
  // grounding, we resolve via Perplexity, then re-call so the model can emit
  // the user-facing tool (ask_user / finalize_brief). Capped at 2 passes total.
  for (let step = 0; step < 2; step++) {
    const result = await generateText({
      model: openai(MODEL_ID),
      system,
      messages,
      tools,
      toolChoice: "auto",
      providerOptions,
    });

    const newAssistant = result.response.messages
      .filter((m): m is AssistantModelMessage => m.role === "assistant")
      .at(-1);
    if (!newAssistant) {
      throw new Error("OpenAI returned no assistant message.");
    }

    messages = [...messages, newAssistant];
    const calls = toolCallParts(newAssistant);

    if (calls.length === 0) {
      const text = result.text || "";
      return { messages, view: { kind: "message", text } };
    }

    const first = calls[0];

    // Grounding pass: resolve Perplexity, append real tool-result, loop.
    if (first.toolName === "lookup_canonical_plot" && groundingsLeft > 0) {
      groundingsLeft--;
      const { title } = first.input as LookupInput;
      let plotSummary: string;
      try {
        const r = await lookupCanonicalPlot(title);
        plotSummary = r.summary;
      } catch {
        plotSummary = `Could not fetch live data for "${title}". Use your training knowledge of this story; if you're uncertain on key plot beats, ask the user to confirm them with ask_user.`;
      }
      const toolResult: ToolModelMessage = {
        role: "tool",
        content: calls.map((c) => ({
          type: "tool-result" as const,
          toolCallId: c.toolCallId,
          toolName: c.toolName,
          output:
            c.toolName === "lookup_canonical_plot"
              ? { type: "text" as const, value: plotSummary }
              : { type: "json" as const, value: { ok: true } },
        })),
      };
      messages = [...messages, toolResult];
      continue;
    }

    // Terminal tools (ask_user / finalize_brief): ack with stub result; UI
    // renders from the assistant's tool-call args, not the tool-result body.
    const stubResult: ToolModelMessage = {
      role: "tool",
      content: calls.map((c) => ({
        type: "tool-result" as const,
        toolCallId: c.toolCallId,
        toolName: c.toolName,
        output: { type: "json" as const, value: { ok: true } },
      })),
    };
    messages = [...messages, stubResult];

    if (first.toolName === "start_book") {
      const args = first.input as StartBookInput;
      return {
        messages,
        view: { kind: "route", mode: args.mode, idea: args.idea },
      };
    }
    if (first.toolName === "ask_user") {
      return {
        messages,
        view: viewFromAsk(first.input as AskUserInput, result.text),
      };
    }
    if (first.toolName === "finalize_brief") {
      return {
        messages,
        view: viewFromFinalize(first.input as FinalizeInput, mode),
      };
    }
    if (first.toolName === "finalize_activity") {
      const plan = await planActivityBook(
        activityInputFromArgs(first.input as FinalizeActivityInput),
      );
      return { messages, view: { kind: "activity-plan", plan } };
    }
    if (first.toolName === "lookup_canonical_plot") {
      // Grounding budget exhausted — ask the user to summarize so we can move on.
      return {
        messages,
        view: {
          kind: "message",
          text: "Hmm, I couldn't verify that story's canonical plot. Could you give me a one-line summary so I can plan the scenes accurately?",
        },
      };
    }
    throw new Error(`Unknown tool: ${first.toolName}`);
  }

  // Two passes used and still no terminal tool — graceful fallback.
  return {
    messages,
    view: {
      kind: "message",
      text: "Let me try that again — could you describe the story in one or two sentences?",
    },
  };
}
