/**
 * Shared guardrails — imported by every prompt-builder module under
 * `lib/prompts/`. Tuning a kid-safe / anatomy / KDP-quality rule once here
 * propagates to every page, cover, and reference-led prompt.
 *
 * NOTE: these strings are sent to image / text models verbatim. Read the
 * "Prompts" section of AGENTS.md before editing — example sub-clauses leak
 * into output (the savanna / acacia / coral examples that used to live in
 * this file primed Gemini to draw trees on every book).
 */

// IP / brand-avoidance rule shared by every prompt-builder that asks an LLM
// to invent characters, scenes, or page subjects. Keeps the wording in one
// place so adding "no Marvel" once propagates to chat planning, story
// planning, single-image-ideas, and the JSON book planner. Re-exported via
// `lib/prompts/index.ts` because `lib/book-chat.ts` and `lib/book-planner.ts`
// import it from outside the `lib/prompts/` folder.
export const NO_REAL_BRAND_RULE =
  "Avoid copyrighted material — no Disney / Pixar / Marvel characters, no Pokémon, no branded logos, no real celebrities.";

export const ANATOMY_GUARDRAIL =
  "Anatomy must be correct and natural-looking: exactly the right number of legs, arms, ears, eyes, tail, fingers, and wings for the species — symmetrical facial features, both eyes on the face, mouth properly placed — nothing duplicated, nothing fused, nothing misaligned, nothing out of place. No extra limbs, no missing limbs.";

// Stricter version that enumerates per-species body-part counts. Used by
// every illustrative surface that draws living creatures (story interior
// pages, story covers, coloring covers, etc.) — applies whenever the
// model is rendering animals where the line-count error mode is "extra
// legs/ears/wings sticking out at odd angles".
export const ANATOMY_COUNT_RULE =
  "🚨 Anatomy count — STRICT and UNIVERSAL, applies to every creature on every page (coloring book, story book, cover, interior page, belongs-to, refine — every surface). Render each species with the EXACT body-part count of a real animal — never more, never fewer, never duplicated. " +
  // Mammals (4-legged) — most common
  "QUADRUPED MAMMALS (lion, tiger, bear, panda, dog, cat, fox, wolf, horse, cow, sheep, deer, rabbit, hare, mouse, squirrel, raccoon, hedgehog, hamster, capybara, etc.): EXACTLY 4 legs, 2 ears, 2 eyes, 1 nose, 1 mouth, 1 tail. " +
  // Elephants
  "ELEPHANTS: EXACTLY 4 legs, 1 trunk, 2 ears (large flat fan-shaped), 1 tail. ❌ NO 5th / 6th leg sticking out from behind / belly / rear. ❌ NEVER mistake the trunk or tail for an extra leg. " +
  // Monkeys / apes
  "MONKEYS / APES (chimp, gorilla, orangutan, lemur): 2 arms + 2 legs + 1 tail (long curling — apes have no tail). ❌ NO second tail — monkeys have ONE tail, never two, even when the body curves and the tail loops; render the tail ONCE per monkey. " +
  // Birds
  "BIRDS (parrot, owl, duck, chicken, penguin, eagle, sparrow, robin, peacock, etc.): EXACTLY 2 wings + 2 legs + 1 beak + 1 tail (the tail-feather fan counts as ONE tail). ❌ NO 3rd wing — birds have TWO wings, never three; folded wing-tips, foliage, or tail feathers near the bird are NOT extra wings. " +
  // Rabbits / hares — ear count is the common error
  "RABBITS / HARES: EXACTLY 2 long upright ears, never 3 or 4. " +
  // Reptiles
  "REPTILES (turtle, tortoise, lizard, gecko, iguana, crocodile): 4 legs, 2 eyes, 1 tail. ❌ NO 5th / 6th leg poking from under the shell. SNAKES: 0 legs, 2 eyes. " +
  // Insects + arachnids
  "INSECTS (bee, butterfly, ladybug, ant, grasshopper, dragonfly): 6 legs, 2 antennae, 4 wings (butterflies and bees) OR 2 wings (flies and dragonflies have 2 pairs that often look like 4 — match the species). SPIDERS: 8 legs, 0 antennae, 0 wings. " +
  // Aquatic
  "FISH (goldfish, clownfish, pufferfish, etc.): 1 dorsal fin, 1 tail, 2 side fins (one each side), 2 eyes. NO legs, NO arms. WHALES / DOLPHINS: 1 dorsal fin, 1 horizontal tail, 2 flippers. OCTOPUSES: EXACTLY 8 arms (tentacles), no more. " +
  // Mythical
  "DRAGONS: 4 legs + 2 wings + 1 tail OR 2 legs + 2 wings + 1 tail (wyvern) — pick one and stick to it; never render a dragon with extra wings or extra tails. UNICORNS: 4 legs, 1 horn, 1 mane, 1 tail. MERMAIDS: 1 fish tail (replaces legs), 2 arms, 1 head, 1 hair flow — NO legs poking out under the tail. " +
  // Upright toddler pose
  "UPRIGHT TODDLER POSE — when a quadruped mammal stands upright like a toddler (panda, bear, fox, etc.), render 2 arms + 2 legs (4 limbs total) plus 1 tail. NEVER 4 legs + 2 arms (that's 6 limbs, anatomically impossible). " +
  // Two characters together — common bug
  "MULTI-CHARACTER PAGES — when 2+ characters share a page, count EACH character's body parts INDEPENDENTLY. One character's leg, tail, or wing must NEVER read as belonging to another character standing nearby. " +
  // Final check
  "🚨 DUPLICATE-PART CHECK BEFORE FINAL RENDER — trace each animal's body silhouette mentally and count every visible TAIL, every visible WING, every visible LEG / ARM, every visible EAR / HORN. If any count exceeds the species' real number, REMOVE the extras before submitting. Common error modes to actively check: (a) curving body → tail-shape duplicated → there is ONLY ONE tail per animal; (b) folded wing tip → looks like a 3rd wing → there are ONLY TWO wings on a bird; (c) leg behind body line gets re-drawn in front → count from a single coherent skeleton, not from multiple overlay attempts; (d) accessory or fold of fabric / fur shaped like an ear / horn / wing → it is NOT an extra body part. Vines, sticks, branches, foliage, props, or another character's limbs that cross behind / beside an animal must NOT be drawn shaped like an extra body part of that animal.";

// Vehicles, objects, and inanimate things drawn with cartoon faces (talking
// trucks, friendly suns, character clouds) are a recurring trouble spot —
// the model often produces uneven eyes, off-center mouth, or "smudged"
// facial features. This guardrail enforces a clean, simple cartoon-face
// pattern wherever a non-living subject has a face.
export const ANTHRO_FACE_GUARDRAIL =
  "If the subject is an inanimate object that has been given a cartoon face — applies whenever the subject is a non-creature thing such as a vehicle, fruit, sun, cloud, household item, or similar — the face MUST be SIMPLE and SYMMETRIC: EXACTLY TWO equal-sized round eyes total (filled black or simple circle outline), placed at the same height, evenly spaced left-and-right around the centerline, never cross-eyed and never with iris pupils that wander. ❌ NEVER 3 eyes, NEVER 4 eyes, NEVER an extra eye on a headlight, on a fender, on the windshield, or anywhere else. For vehicles specifically: the TWO eyes are the ONLY face features; HEADLIGHTS are NOT additional eyes — render headlights as plain round circles below or beside the eyes, NOT with pupils inside them; the GRILLE is a mouth shape, not a row of teeth-eyes. ONE clearly visible mouth (a simple curved smile or open round 'O'), centered horizontally below the eyes. No eyebrows, no complex mouth shapes, no teeth detail, no crooked features. The face must look intentional and clean — like a child-friendly cartoon decal, not a smudged or distorted attempt. When the subject is a vehicle, place the face on the front grille / windshield area, not on the side. After sketching, COUNT the eyes — if more than 2, REMOVE the extras (most likely the model added pupils inside the headlights; flatten those headlights back to plain circles).";

export const ARTIFACT_GUARDRAIL =
  "ABSOLUTELY NO TEXT OR ATTRIBUTION OF ANY KIND ANYWHERE on the page. This includes: no model name (NO 'Nano', 'Banana', 'Gemini', 'AI', 'Generated by', or any vendor/product attribution text — the model must NEVER stamp its own name on the image), no letters, no numbers, no labels, no speech bubbles, no watermarks (visible or stylized), no signatures, no logos, no captions, no frames-within-frames, no page numbers, no signature dots, no glassy/translucent text overlays in any corner. Scan the four corners and bottom strip of the canvas for stray attribution text and ensure they are completely empty of letters. A single coherent illustration with ZERO text marks.";

// KDP print-ready quality directives — applied to every page.
export const KDP_QUALITY_GUARDRAIL =
  "KDP print-ready quality: 100% pure black ink lines on 100% pure white page background. No solid black fills anywhere on the page — not on the subject's body parts (no all-black paw, leg, mane, tail), not on the sky, not on the ground, not on any prop. No gray shading, no halftones, no hatching, no stippling, no cross-hatch, no near-black tones, no near-white tones. No gradients of any kind: no atmospheric gradient near the page edges, no soft gray haze under the subject, no shadow gradient on the ground, no vignette around the artwork, no gray fog at the bottom or sides. The page edges are PURE WHITE right up to the canvas border — never a faded or grayish tint. The ground is rendered as a single thin line plus optional small detail (grass tufts / sand dots / floor lines), never as a shaded gray area. No silhouette / negative-space drawing (the page is never an inverted dark scene with white outlines — black is the line color, white is the background, always). Every line is a closed crisp continuous stroke — no broken lines, no gaps, no double lines. All shapes are fully enclosed by their outlines so a child can color them in cleanly without color spilling out. Consistent thick uniform line weight throughout the page (~3pt at print size). High-resolution, vector-clean appearance.";

// CRITICAL — repeat the color rule with absolute clarity at the END of the
// prompt. Scene/subject text often mentions colors ("golden grasses", "blue
// sky", "green trees", "brown fox") for identification — Gemini occasionally
// interprets those as fill instructions and emits a partly-colored image.
// This override is the LAST thing the model reads.
export const FINAL_BW_OVERRIDE =
  "🚫 ABSOLUTE COLOR OVERRIDE — READ THIS LAST: This image MUST be 100% pure black-and-white line art ONLY. Even though the subject and scene descriptions above mention colors (golden, blue, green, brown, red, pink, yellow, orange, etc.), those color words are for IDENTIFICATION ONLY — they describe what the subject IS in real life, NOT what to paint. The actual generated image contains ZERO color, ZERO shading, ZERO gray fills, ZERO gradients. Pure white background, pure black outlines. If you are about to add any color or any non-black non-white pixel anywhere — STOP and remove it. The output is a coloring page for a child to color in themselves.";

export const STYLE_CONSISTENCY =
  "Maintain a consistent cartoon style across the whole book: same line weight, same eye style (round friendly), same proportions philosophy, same level of detail. This page must look like a sibling of the other pages in the same book.";

// IMPORTANT: the scene should EXTEND to all four edges of the canvas like
// a real printed coloring-book page (think: cow standing in a field with
// barn + sky reaching every edge; pig in a meadow with trees + sun + fence
// reaching every edge). NO empty white margin around the scene. Only
// PRINTER-SAFE detail rule: keep critical features (eyes, mouth, faces,
// small text-like elements) at least 4% away from the absolute edge so a
// 2% trim variance during binding doesn't crop them off — but background
// elements (grass, sky, hills, water, foliage) SHOULD reach the page edge.
export const FILL_CANVAS_RULE =
  "🚨 FILL THE ENTIRE CANVAS EDGE-TO-EDGE — STRICT, applies to every page. The illustration extends to ALL FOUR edges of the canvas like a printed picture-book scene. Concretely: TOP edge (sky / ceiling / canopy / upper environment) reaches the top pixel row. BOTTOM edge (ground / floor / water / lower environment) reaches the bottom pixel row. LEFT edge (mid-ground supporting elements — buildings, trees, walls, plants — whatever fits this subject's habitat) reaches the left pixel column. RIGHT edge (same: supporting elements appropriate to the subject) reaches the right pixel column. The illustration MUST visibly touch all four edges. ❌ DO NOT leave any empty white margin between the artwork and the canvas edges — no white strip at the top, no white strip at the bottom, no white strip on the left, no white strip on the right. ❌ DO NOT contract the scene into the center with white space around it. ❌ DO NOT use white as a background fill — the canvas is filled with line-art scene content right up to the edges. White inside the page is reserved for unfilled regions of the line-art that the kid will color (interior of shapes), NOT for empty margin. Printer-safety: keep CRITICAL detail (the main character's face, eyes, mouth, tiny readable features) at least 4% away from the absolute edge so a binding-trim variance doesn't crop them off — but BACKGROUND elements (sky, ground, mid-ground supporting props) MUST extend right up to the canvas edge. Pick whichever elements fit the subject's environment; never default to grass / hills / tree branches / clouds unless the subject genuinely lives in that kind of setting.";

// Used by the "minimal" / "framed" presets where the subject sits on
// mostly-white (not an edge-to-edge scene). Keeps essential features
// inside a generous central area without forcing background to the edges
// (since there isn't one).
export const PRINT_TRIM_SAFETY_RULE =
  "PRINTER TRIM SAFETY: Keep the subject's critical features (face, eyes, hands, paws, tail tip) at least 5% inside from every edge of the page so a small binding-trim variance doesn't crop them. The subject silhouette should not bump directly into the page edge.";

// SINGLE source of truth for the printed page outline. Compressed to one
// concise rule on purpose — earlier versions repeated "border" 13+ times
// in one paragraph and the model started drawing two of them. KDP-framed:
// the inset and trim safety align with KDP's printer-safe interior spec.
export const DRAW_BORDER_RULE =
  "📐 PAGE FRAME (KDP printer-safe rule, applies once — DO NOT REPEAT): Draw exactly ONE thin solid black rectangular outline at 3% inset from each page edge. Line weight ~1.5px, uniform thickness, four 90° corners, plain rectangle only. NO ornaments, NO rounded corners, NO decorative flourishes, NO double lines, NO second inset rectangle inside the first — if you start to draw a second one, stop. Keep all artwork inside this outline with ~4% buffer; nothing touches or crosses it. Identical position and thickness on every page in the book.";

// New rule used by the master coloring-page prompt: explicitly forbid the
// AI from drawing ANY border, frame, or rectangular outline at the page
// edge. The printable border is added at PDF-assembly time as a vector
// rectangle (lib/pdf.ts) — that's deterministic, identical on every page,
// and free of the "two borders" / "double line" failure mode that plagued
// the AI-drawn version. With this rule active, Gemini fills its canvas
// edge-to-edge with line art only; pdf-lib stamps the printer border on
// top during download.
export const NO_AI_BORDER_RULE =
  "🚨 RULE #1 — READ THIS FIRST AND OBEY. The page MUST BE BORDERLESS. Do NOT draw a rectangular border. Do NOT draw a page outline. Do NOT draw a printer's frame. Do NOT draw a thin black rectangle at 3% / 4% / 5% / any inset from the page edges. Do NOT draw ANY rectangle, frame, outline, or printer's mark anywhere — even faintly, even in the corners. The page is COMPLETELY BORDERLESS from your side. You are SEEING coloring books in your training data that have borders, but THIS BOOK DOES NOT — the printer's vector border is added in POST-PROCESSING after you finish, so any border you draw produces a DOUBLE BORDER on the printed page (a quality failure that gets the page rejected). The illustration content fills the canvas edge-to-edge with NOTHING else at the edges. Before submitting the image, scan the four edges and four corners — if you see ANY straight line forming a rectangle near the edges, REMOVE IT. Only the line art of the actual scene/subject content. NO frame. NO border. NO outline rectangle. ZERO.";

// Locks the LOOK of common scene elements when (and only when) they actually
// belong in the scene. Critically does NOT mandate that they appear — only
// describes how to draw them IF the scene calls for them. Without this
// "IF/ONLY" framing, Gemini was adding sun+clouds to every page including
// underwater, indoor, space, and night scenes.
export const COMMON_ELEMENT_STYLE =
  "🚨 STYLE LOCK FOR COMMON ELEMENTS — STRICT. Do NOT add ANY backdrop element (sun, sky, clouds, moon, stars, ground line, grass, trees, road, mountains, hills, fence) unless the scene description above EXPLICITLY mentions that element by name. The default state for every element on this list is OFF; you only turn one on when the brief literally calls for it. ❌ Never add a sun or a cloud just because 'every cartoon page has them' — most pages do NOT need either. ❌ Indoor scenes have NO sky / sun / cloud / outdoor ground. ❌ Underwater scenes have NO sun / cloud — only water, seabed, bubbles. ❌ Space / night scenes have NO sun. ❌ Vehicle / object pages (a fire truck, an apple, a guitar) on plain backgrounds have NO sun, NO cloud, NO grass — let the subject stand alone. ❌ Never draw BOTH a sun AND a moon in the same scene. WHEN the scene DOES explicitly call for one of these, render them as: SUN = a plain simple circle with exactly 8 short straight evenly-spaced rays, NO face, NO smile, NO eyes; CLOUDS = simple rounded bumpy outlined shapes with no detail inside; GROUND = a single short horizontal line with at most 2 small grass tufts; TREES = simple rounded bushy crown on a straight trunk; ROAD = two parallel straight lines. Never decorate these supporting elements with faces or expressions — they are background only.";

export const KID_SAFE_CONTENT_RULE =
  "Kid-safe: every creature, plant, and object is a round, smiling, friendly cartoon — would pass a parent's bedtime test for a 4-year-old. No realistic-anatomy detail on any object (no organ-like shapes, vein/intestine textures, brain-coral lookalikes); no skulls, bones, blood, scars, fangs, snarls, hunting scenes; no weapons of any kind (replace swords/guns with flags, shields, treasure); no fire/destruction, dead trees with face-like knots, hollow or glowing eyes; no medical/dental/surgical imagery, graveyards, frightening ghosts/demons; no religious or political symbols (crosses, swastikas, national flags); no alcohol/cigarettes/drugs; nothing sexual or suggestive. When a brief implies any of the above, swap to a kid-safe alternative (shark teeth → closed smile, sword → flag, cracked tree → healthy tree).";

// Five load-bearing rules stated once. Repetition was actively hurting
// compliance — the prior version mentioned "draw one border" 3-4 times
// and the model started drawing two nested borders.
export const ANCHOR =
  "Five rules to obey: " +
  "(1) Pure black-and-white LINE ART only — thin black outlines on a 100% white page. " +
  "    No solid black fills (a paw, leg, body, hair, sky, or any other region must NEVER be filled solid black). " +
  "    No gray shading, no halftones, no hatching, no stippling, no cross-hatch, no spot-blacks, no silhouettes. " +
  "    No white-on-black inversion (the page is NEVER a black sky / black background with white drawings — even for night, space, or outer-space scenes the rule is reversed: draw black outlines of stars, moon, planets on the white page, NOT a black background with white stars). " +
  "    Color words in the brief refer to the subject's identity (a 'black cat', a 'red barn'), never to actual ink — render them as outlines only, the kid colors them. " +
  "(2) The scene fills the canvas edge-to-edge — no empty white margin around the artwork. " +
  "(3) The single main subject is 50-65% of the page (large, dominant, same scale on every page); the rest of the canvas is themed background, not white space. " +
  "(4) Each named character appears exactly once per page. Crowds are simple small silhouettes without detailed faces — never repeat the hero. " +
  "(5) Only the named subject is drawn as a character. No partial creatures (tails, ears, paws, manes) peeking from the background — the background is environment only.";
