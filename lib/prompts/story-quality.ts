export const STORY_PLANNER_QUALITY_RULES = `STORY QUALITY GATE (future-book protection)
Before returning the JSON, proofread every human-readable string: title, coverTitle, description, coverScene, backCoverTagline, bottomStripPhrases, sidePlaqueLines, every dialogue line, every narration caption, and every prompt subject. Fix spelling, grammar, missing words, duplicated words, awkward word choices, and tense mismatches. Use common simple English; avoid rare variants and invented words unless the user explicitly asked for a fantasy name. Copy repeated story nouns exactly from the title and prior pages every time they appear. Every dialogue and narration line must be a complete natural sentence unless it is a short interjection.

TERMINAL PUNCTUATION
Every narration caption and every dialogue line MUST end with a terminal punctuation mark — period (.), exclamation (!), or question mark (?). No exceptions. Re-read each string and add the terminal mark if it is missing. Lines ending mid-thought without punctuation are a defect.

CHILD-FRIENDLY VOCABULARY
Use unambiguous concrete nouns kids in the selected age band recognize on first read. Never use a vague short-form noun ("piece", "thing", "stuff", "it") to refer back to a previously named object when the referent could be confused. Restate the full noun ("the map piece", "the missing corner", "the basket of berries") rather than the shortcut. If a noun must be replaced for length, use a clear synonym (corner, chunk, scrap) — never an abstract placeholder. Test every line aloud as if read by a child in the selected age band; if any sentence forces the reader to guess what the noun refers to, rewrite it.

TEXT LENGTH FOR IMAGE RELIABILITY
Keep image-rendered text short because the image model must draw it exactly. Dialogue is max 12 words per bubble (toddler band), 18 (kids), 24 (tweens). Narration is max 14 words for toddlers, 22 for kids, 30 for tweens — but always prefer the shorter end of that range. Never create duplicate or near-duplicate bubbles on the same page. Cover overlay phrases use plain familiar words only.

DIALOGUE DENSITY (user-controlled)
The brief includes a \`dialogueStyle\` setting picked by the user: "quiet", "balanced", or "chatty". Respect it across the book.
- "quiet" — narration-driven, bedtime/cozy energy (Goodnight Moon, The Snowy Day). About 25% of pages have a single speech bubble; the rest are narration captions or wordless. Never use 2-bubble exchanges.
- "balanced" — mix of captions and dialogue (Beatrix Potter, Frog and Toad). About 50% of pages have a speech bubble; the rest are narration. At most 1-2 pages may use a 2-bubble back-and-forth between two visible characters.
- "chatty" — conversation-driven (Pigeon series, Pete the Cat). About 80% of pages have at least one speech bubble. Plan 4-6 pages with a true 2-bubble back-and-forth between two visible characters.
Pages with only narration should be transition / landscape / quiet beats — never pages where two named characters are interacting on-screen (those should carry a bubble unless dialogueStyle = "quiet").

SPEAKER AND TEXT OWNERSHIP
Every dialogue line belongs to the character who would naturally know, say, or admit that line. If the words are an apology, confession, request, warning, question, or answer, the speaker must be the character performing that story role in the scene. Do not let a different character say the visitor's confession, the helper's apology, the owner's question, or the narrator's summary. If the line would be clearer as narration, use narration instead of a speech bubble. Do not put the same factual sentence in both narration and dialogue.

SPEAKER MUST BE ON THE PAGE
A speech bubble's named speaker MUST appear in this page's cast_on_page. Never assign a line to a character who is not drawn on the page. If the story logic requires a line by character X but the scene doesn't show X, either (a) add X to the page so they can speak, or (b) convert the line to narration. Symmetric rule for the protagonist: if the page beat involves the protagonist being told, asked, given, taught, or shown something, the protagonist MUST be in the cast_on_page for that scene. Never write a "directions to the protagonist" scene with the protagonist absent.

PROTAGONIST PRESENCE
The protagonist appears on every page unless the page brief explicitly says they are off-screen (sleeping in another room, looking from far away, etc.) and the narration / dialogue does NOT name or address them. Default is: protagonist present. When the page beat is "the protagonist learns X" or "the protagonist hears X" or "the protagonist decides X", the protagonist is in the frame.

FIRST-MENTION NAMING
When a named character first appears in the book, the FIRST page they appear on must introduce them by name in narration or dialogue (e.g. "Pippa met Hazel the owl." or a bubble "Hi, I'm Milo."). Do not refer to a character by name in narration on a later page if the reader has not yet seen the name on a prior page. Cover overlays do not count as "introduction" — names must enter the interior text.

CAST AND CONTINUITY LOCK
Every page subject must name exactly which locked characters appear on that page. Do not add unnamed extra animals, children, creatures, or background characters unless the story beat explicitly needs a crowd; when a crowd is needed, describe it as simple distant background silhouettes with no detailed faces. If the story beat says a character is alone, lonely, excluded, watching, or separated, the subject must keep other characters absent or clearly far away so the art does not contradict the emotion. Character outfits and accessories are LOCKED for the whole book: a red bow at the neck stays a red bow at the neck on every page; a red backpack on the back stays a red backpack on the back on every page. Never swap a backpack for a scarf or vice versa.

STORY-BEAT HONESTY
The picture must show the same event as the words. If a page is about noticing, helping, thanking, spilling, sharing, joining, or being invited, include the relevant actor, receiver, object, and reaction in the same frame. Do not move the main event off-screen. Do not add magical glow, sparkles, dramatic darkness, night, or a new season unless that beat is part of the story.

CLASSIC STORY SEQUENCE LOCK
For a known public-domain tale, keep the canonical cause-and-effect order and character roles. Do not show characters witnessing events that happen while they are away. Do not move clues, food, objects, rooms, or discoveries to a different location unless a bridge page explains the movement. A clue trail must be visibly logical from the previous scene to the next scene.

VISUAL VARIETY ACROSS PAGES
Avoid rendering 3+ consecutive pages as the same character lineup at the same eye-level framing. In the composition hints, vary camera framing across the book: include at least one close-up (one character fills 50%+ of the frame), one mid-shot, one wide shot, and at least one overhead, worm's-eye, or over-the-shoulder angle. Do not use the same standing-and-looking pose on more than two consecutive pages.

CHILD SAFETY AND REAL-WORLD LOGIC
For ages 3-10, avoid unsafe child behavior around heat, fire, knives, high ledges, unstable stools, or heavy objects. If a page needs cooking, repairing, climbing, or another risky action, show a calm adult actively helping while the child stays stable and away from danger. Keep consequences gentle but clear.

FINAL SELF-CHECK
Read the page names, subjects, dialogue, and narration in order. They must form one clear story with consistent character scale, accessories, relationships, objects, locations, time of day, and emotional state. Verify: (a) every line ends with terminal punctuation, (b) every speaker is in the page cast, (c) the protagonist is present on every page that addresses or involves them, (d) every named character is introduced by name on their first appearance, (e) no consecutive pages share the same framing+lineup. Rewrite any page that fails any of these checks.`;

export const STORY_RENDER_TEXT_ACCURACY_RULE =
  "Text accuracy gate: render only the supplied dialogue and narration text. Copy every word exactly as written, with the same spelling, punctuation, casing, and word order. No duplicated words, no missing words, no corrected-to-a-different-word substitutions, no invented text. Never create a second copy of the same line. Before finalizing, read every drawn word back against the prompt; if any word differs, redraw the text area.";

export const STORY_RENDER_CAST_CONTINUITY_RULE =
  "Cast continuity gate: draw only the locked characters named by this page's scene, dialogue, or narration. Do not add unnamed extra animals, children, creatures, onlookers, duplicate heroes, or decorative side characters. If the page says a character is alone, lonely, excluded, watching, or separated, the visual must preserve that emotional truth. Keep recurring character scale, accessories, colors, markings, and body proportions consistent with the locked descriptors and references.";

export const STORY_RENDER_BEAT_HONESTY_RULE =
  "Story-beat honesty gate: the page must show the exact event described in the scene text. If the beat involves noticing, helping, thanking, spilling, sharing, joining, or invitation, show the actor, receiver, object, and reaction together in the same frame. Do not move the important action off-screen. Do not add magical glow, sparkles, dramatic darkness, night, a new season, or a mood shift unless the page brief explicitly says so.";

export const STORY_RENDER_INTERIOR_NO_ATTRIBUTION_RULE =
  "Interior attribution ban: never draw author names, app names, publisher names, signatures, stamps, logos, model labels, or brand marks on interior story pages. This includes bottom-center text, corner text, footer signatures, and any CrayonSparks wording copied from a cover reference. Interior pages contain only the supplied narration and dialogue.";

export const STORY_RENDER_CHILD_SAFETY_RULE =
  "Child-audience safety gate: show safe, calm actions for the selected age group. No child or small character may stand on an unstable stool beside heat, reach over fire, handle sharp tools, climb high furniture, or carry heavy objects alone. If the scene involves cooking, fixing, climbing, or hot objects, show a stable helper and keep the child safely away from the hazard.";
