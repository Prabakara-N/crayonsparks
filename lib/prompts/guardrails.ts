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

// Age-band infrastructure shared by every prompt-builder that targets a
// specific reader age. One source of truth so adding a new band (or
// retuning word caps / audience copy) propagates everywhere.
export type AgeBand = "toddlers" | "kids" | "tweens";

export const AGE_BAND_RANGE: Record<AgeBand, string> = {
  toddlers: "3-6",
  kids: "6-10",
  tweens: "10-14",
};

export const AGE_BAND_LABEL_SINGULAR: Record<AgeBand, string> = {
  toddlers: "toddler",
  kids: "kid",
  tweens: "tween",
};

export const AGE_BAND_PAGE_NOTE: Record<AgeBand, string> = {
  toddlers:
    "Audience: toddlers 3-6. Friendly rounded characters with big expressive eyes, big simple shapes, calm safe scene, no scary or stressful imagery.",
  kids:
    "Audience: kids 6-10. Lively storybook staging with clear action, expressive faces, and readable text. Slightly more environmental detail than the toddler band while staying friendly and child-safe.",
  tweens:
    "Audience: tweens 10-14. Polished storybook staging with nuanced expressions, richer composition, and more detailed environments. Calm and child-safe — no edgy or stressful imagery.",
};

export const AGE_BAND_BACK_NOTE: Record<AgeBand, string> = {
  toddlers:
    "Audience: toddlers 3-6. Calm, spacious, lots of breathing room — the visual mood matches the gentle picture-book feel of the front cover.",
  kids:
    "Audience: kids 6-10. Clean and friendly with generous breathing room — the visual mood matches the lively picture-book feel of the front cover.",
  tweens:
    "Audience: tweens 10-14. Calm, polished, generous margins — the visual mood matches the picture-book feel of the front cover.",
};

export const AGE_BAND_AUDIENCE_PILL: Record<AgeBand, string> = {
  toddlers: "PICTURE BOOK · AGES 3-6",
  kids: "PICTURE BOOK · AGES 6-10",
  tweens: "PICTURE BOOK · AGES 10-14",
};

export const AGE_BAND_PLAQUE_TAGLINE: Record<AgeBand, string> = {
  toddlers: "PERFECT FOR TODDLERS!",
  kids: "PERFECT FOR LITTLE KIDS!",
  tweens: "PERFECT FOR BIG KIDS!",
};

export const DIALOGUE_MAX_WORDS: Record<AgeBand, number> = {
  toddlers: 12,
  kids: 18,
  tweens: 24,
};

export const TAGLINE_MAX_WORDS: Record<AgeBand, number> = {
  toddlers: 22,
  kids: 30,
  tweens: 40,
};

// Dialogue style — picked by the user (or asked by Sparky). Controls how
// many speech bubbles the planner emits. Three positions map to real
// kid-book market segments: quiet bedtime (Eric Carle), balanced narrative
// (Beatrix Potter), and chatty character-voice (Mo Willems Pigeon).
export type DialogueStyle = "quiet" | "balanced" | "chatty";

export const DIALOGUE_STYLE_LABEL: Record<DialogueStyle, string> = {
  quiet: "Quiet",
  balanced: "Balanced",
  chatty: "Chatty",
};

export const DIALOGUE_STYLE_DESCRIPTION: Record<DialogueStyle, string> = {
  quiet:
    "Narration-driven — captions carry the story, rare speech bubbles (Goodnight Moon / The Snowy Day energy).",
  balanced:
    "Captions and dialogue in equal measure (Beatrix Potter / Frog and Toad energy).",
  chatty:
    "Conversation-driven — most pages have a bubble, with several back-and-forth exchanges (Pigeon / Pete the Cat energy).",
};

export const DIALOGUE_STYLE_TARGET: Record<DialogueStyle, string> = {
  quiet:
    "About 25% of pages have a single speech bubble; the rest are narration captions or wordless. No two-bubble exchanges. Total bubble lines across the book ≈ pageCount × 0.25.",
  balanced:
    "About 50% of pages have a speech bubble; the rest are narration. At most 1-2 pages may use a 2-bubble back-and-forth between two visible characters. Total bubble lines across the book ≈ pageCount × 0.55.",
  chatty:
    "About 80% of pages have at least one speech bubble. Plan 4-6 pages with a true 2-bubble back-and-forth between two visible characters. Total bubble lines across the book ≈ pageCount × 1.0 (some pages have two).",
};

export const DEFAULT_DIALOGUE_STYLE: DialogueStyle = "balanced";

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
  "Anatomy count — STRICT and UNIVERSAL, applies to every creature on every page (coloring book, story book, cover, interior page, belongs-to, refine — every surface). Render each species with the EXACT body-part count of a real animal — never more, never fewer, never duplicated. " +
  // Mammals (4-legged) — most common
  "QUADRUPED MAMMALS (lion, tiger, bear, panda, dog, cat, fox, wolf, horse, cow, sheep, deer, rabbit, hare, mouse, squirrel, raccoon, hedgehog, hamster, capybara, etc.): EXACTLY 4 legs, 2 ears, 2 eyes, 1 nose, 1 mouth, 1 tail. " +
  // Elephants
  "ELEPHANTS: EXACTLY 4 legs, 1 trunk, 2 ears (large flat fan-shaped), 1 tail. NO 5th / 6th leg sticking out from behind / belly / rear. NEVER mistake the trunk or tail for an extra leg. " +
  // Monkeys / apes
  "MONKEYS / APES (chimp, gorilla, orangutan, lemur): 2 arms + 2 legs + 1 tail (long curling — apes have no tail). NO second tail — monkeys have ONE tail, never two, even when the body curves and the tail loops; render the tail ONCE per monkey. " +
  // Birds
  "BIRDS (parrot, owl, duck, chicken, penguin, eagle, sparrow, robin, peacock, etc.): EXACTLY 2 wings + 2 legs + 1 beak + 1 tail (the tail-feather fan counts as ONE tail). NO 3rd wing — birds have TWO wings, never three; folded wing-tips, foliage, or tail feathers near the bird are NOT extra wings. " +
  // Rabbits / hares — ear count is the common error
  "RABBITS / HARES: EXACTLY 2 long upright ears, never 3 or 4. " +
  // Reptiles
  "REPTILES (turtle, tortoise, lizard, gecko, iguana, crocodile): 4 legs, 2 eyes, 1 tail. NO 5th / 6th leg poking from under the shell. SNAKES: 0 legs, 2 eyes. " +
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
  "DUPLICATE-PART CHECK BEFORE FINAL RENDER — trace each animal's body silhouette mentally and count every visible TAIL, every visible WING, every visible LEG / ARM, every visible EAR / HORN. If any count exceeds the species' real number, REMOVE the extras before submitting. Common error modes to actively check: (a) curving body makes a tail-shape duplicate; there is ONLY ONE tail per animal; (b) folded wing tip looks like a 3rd wing; there are ONLY TWO wings on a bird; (c) leg behind body line gets re-drawn in front; count from a single coherent skeleton, not from multiple overlay attempts; (d) accessory or fold of fabric / fur shaped like an ear / horn / wing; it is NOT an extra body part. Vines, sticks, branches, foliage, props, or another character's limbs that cross behind / beside an animal must NOT be drawn shaped like an extra body part of that animal.";

// Vehicles, objects, and inanimate things drawn with cartoon faces (talking
// trucks, friendly suns, character clouds) are a recurring trouble spot —
// the model often produces uneven eyes, off-center mouth, or "smudged"
// facial features. This guardrail enforces a clean, simple cartoon-face
// pattern wherever a non-living subject has a face.
export const ANTHRO_FACE_GUARDRAIL =
  "Background scenery has NO faces — STRICT. Trees, bushes, leaves, hills, mountains, rocks, clouds, suns (in a non-character book), moons, stars, flowers, fences, houses, distant buildings, kid-room wall decor, window views, posters in the scene — ALL of these are inanimate background and MUST be rendered WITHOUT eyes, mouths, smiles, or any face features. A meadow of trees is just trees: no peering eyes between leaves, no smiling bark, no eyebrow-like branches. A bedroom with stickers on the wall is just stickers: the stickers do NOT have animated faces. Only render a face on a non-creature thing when the page brief EXPLICITLY names that thing as a NAMED CHARACTER in this book's locked cast (e.g. a character explicitly named 'Sunny the Sun' or 'Treebeard the Tree'). If the brief doesn't name it, no face. " +
  "If the subject is an inanimate object that HAS been intentionally given a cartoon face (per the brief) — e.g. a named vehicle, named fruit, named cloud — the face MUST be SIMPLE and SYMMETRIC: EXACTLY TWO equal-sized round eyes total (filled black or simple circle outline), placed at the same height, evenly spaced left-and-right around the centerline, never cross-eyed and never with iris pupils that wander. NEVER 3 eyes, NEVER 4 eyes, NEVER an extra eye on a headlight, on a fender, on the windshield, or anywhere else. For vehicles specifically: the TWO eyes are the ONLY face features; HEADLIGHTS are NOT additional eyes — render headlights as plain round circles below or beside the eyes, NOT with pupils inside them; the GRILLE is a mouth shape, not a row of teeth-eyes. ONE clearly visible mouth (a simple curved smile or open round 'O'), centered horizontally below the eyes. No eyebrows, no complex mouth shapes, no teeth detail, no crooked features. The face must look intentional and clean — like a child-friendly cartoon decal, not a smudged or distorted attempt. When the subject is a vehicle, place the face on the front grille / windshield area, not on the side. After sketching, COUNT the eyes — if more than 2, REMOVE the extras (most likely the model added pupils inside the headlights; flatten those headlights back to plain circles).";

export const RECURRING_ENVIRONMENT_LOCK_RULE =
  "Recurring environment lock — STRICT. When the chain reference (the previously generated page passed as a visual anchor) shows a physical element that ALSO appears in this page's scene — a gate, fence, bench, tree at the entrance, table, bed, sign, vehicle, building, roofline, archway, window, doorway — render it with IDENTICAL color, material, shape, proportions, and ornamentation as in the reference. A red wooden gate stays red and wooden; an arched stone bridge stays arched and stone. Do NOT redesign recurring background elements between consecutive pages — that destroys the reader's sense that this is one continuous story world. If the brief explicitly moves the characters to a NEW location, the new page's scene description names the new location; otherwise default to LOCK the recurring element verbatim from the chain reference.";

export const SCENE_LOCATION_LOCK_RULE =
  "Scene location lock — STRICT. When this page continues a conversational beat or action from the previous page (e.g. the brief says 'they keep talking…' or two pages depict back-to-back moments of the same encounter), the LOCATION stays the same: same ground, same backdrop foliage, same horizon line, same lighting feel. Do NOT relocate the same conversation from a forest path on one page to a flower garden on the next. The chain reference shows you exactly where they were; stay there unless the page subject explicitly transitions them ('they walked to the bridge', 'arriving at the market').";

export const BACKGROUND_CROWD_CONTINUITY_RULE =
  "Background crowd continuity — STRICT. When the page depicts a public event (parade, audience, classroom, market, party) where a crowd is visible behind the protagonists, the crowd's COMPOSITION stays consistent across every page of that same event: same species (all children OR all animals OR a stated mix — never swap between consecutive pages), similar age range, similar clothing palette. A parade with a child audience on page N must have a child audience on page N+1, not animals. If the brief introduces a new event with a different crowd, the page subject will name the new event explicitly.";

export const OUTFIT_VIEW_ANGLE_RULE =
  "Outfit detail by view angle — STRICT. Outfit details are anatomically positioned and only visible from the side they're attached to. A badge / star / patch / pocket / logo / pattern / number on the FRONT of a shirt is INVISIBLE from a back-view camera (over-the-shoulder, walking-away, looking-out-the-window from behind). A motif on the BACK of a shirt is INVISIBLE from a front-view camera. Hair on the back of the head is plain hair, not a face. When the page camera is BEHIND the character (back-view, walking-away, sunset-walk, looking-out shots), do NOT render front-only outfit details — the back of the shirt is plain fabric in the locked garment color, with at most a hood, collar back, or seam line. Same rule for accessories: a watch on the LEFT wrist is invisible when the right side of the character faces camera, etc.";

export const ARTIFACT_GUARDRAIL =
  "ZERO TEXT, ZERO LETTERS, ZERO NUMBERS — STRICT AND ABSOLUTE, NO EXCEPTIONS. The page contains NO letters of any alphabet, NO numerals (0-9), NO words, NO captions, NO speech bubbles, NO labels, NO signs with readable text, NO ABC blocks, NO alphabet flashcards, NO chalkboards with words, NO storefront signs with letters, NO book covers in the scene with titles, NO 'A is for...' style educational elements, NO model name (no 'Nano', 'Banana', 'Gemini', 'AI', 'Generated by', or any attribution), NO watermarks (visible or stylized), NO signatures, NO logos, NO frames-within-frames, NO page numbers, NO signature dots, NO glassy/translucent text overlays in any corner. Even if the subject's name begins with a letter (e.g. Velociraptor, Tiger, Apple) DO NOT draw that letter anywhere — the subject is the animal/object itself, never an alphabet letter. Even if the book's title is 'ABC' or contains a letter, DO NOT draw letters in interior pages. Even if the scene mentions a sign, a book, a banner, a poster, render those elements WITHOUT any readable text on their surface. Before submitting, scan every corner, every prop, every readable surface (signs, books, banners, blackboards, walls, storefronts, screens): if you see ANY shape resembling a letter or number, ERASE IT and leave that surface blank. A single coherent illustration with ZERO text marks anywhere on the canvas.";

// KDP print-ready quality directives — applied to every page.
export const KDP_QUALITY_GUARDRAIL =
  "KDP print-ready quality: 100% pure black ink lines on 100% pure white page background. No solid black fills anywhere on the page — not on the subject's body parts (no all-black paw, leg, mane, tail), not on the sky, not on the ground, not on any prop. No gray shading, no halftones, no hatching, no stippling, no cross-hatch, no near-black tones, no near-white tones. No gradients of any kind: no atmospheric gradient near the page edges, no soft gray haze under the subject, no shadow gradient on the ground, no vignette around the artwork, no gray fog at the bottom or sides. The page edges are PURE WHITE right up to the canvas border — never a faded or grayish tint. The ground is rendered as a single thin line plus optional small detail (grass tufts / sand dots / floor lines), never as a shaded gray area. No silhouette / negative-space drawing (the page is never an inverted dark scene with white outlines — black is the line color, white is the background, always). Every line is a closed crisp continuous stroke — no broken lines, no gaps, no double lines. All shapes are fully enclosed by their outlines so a child can color them in cleanly without color spilling out. Consistent thick uniform line weight throughout the page (~3pt at print size). High-resolution, vector-clean appearance.";

// CRITICAL — repeat the color rule with absolute clarity at the END of the
// prompt. Scene/subject text often mentions colors ("golden grasses", "blue
// sky", "green trees", "brown fox") for identification — Gemini occasionally
// interprets those as fill instructions and emits a partly-colored image.
// This override is the LAST thing the model reads.
export const FINAL_BW_OVERRIDE =
  "ABSOLUTE COLOR OVERRIDE — READ THIS LAST: This image MUST be 100% pure black-and-white line art ONLY. Even though the subject and scene descriptions above may mention colors, those color words are for IDENTIFICATION ONLY — they describe what the subject IS in real life, NOT what to paint. The actual generated image contains ZERO color, ZERO shading, ZERO gray fills, ZERO gradients. Pure white background, pure black outlines. If you are about to add any color or any non-black non-white pixel anywhere — STOP and remove it. The output is a coloring page for a child to color in themselves.";

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
  "FILL THE ENTIRE CANVAS EDGE-TO-EDGE — STRICT, applies to every page. The illustration extends to ALL FOUR edges of the canvas like a printed picture-book scene. Concretely: TOP edge (upper environment) reaches the top pixel row. BOTTOM edge (lower environment or surface) reaches the bottom pixel row. LEFT and RIGHT edges contain supporting elements appropriate to the subject's setting and reach the page edges. The illustration MUST visibly touch all four edges. DO NOT leave any empty white margin between the artwork and the canvas edges — no white strip at the top, bottom, left, or right. DO NOT contract the scene into the center with white space around it. DO NOT use white as a blank background fill; white inside the page is reserved for unfilled regions of the line art that the kid will color, NOT for empty margin. Printer-safety: keep CRITICAL detail (the main character's face, eyes, mouth, tiny readable features) at least 4% away from the absolute edge so a binding-trim variance doesn't crop them off, but background elements MUST extend right up to the canvas edge. Pick whichever elements fit the subject's environment; never default to common outdoor scenery unless the subject genuinely lives in that kind of setting.";

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
  "PAGE FRAME (KDP printer-safe rule, applies once — DO NOT REPEAT): Draw exactly ONE thin solid black rectangular outline at 3% inset from each page edge. Line weight ~1.5px, uniform thickness, four 90° corners, plain rectangle only. NO ornaments, NO rounded corners, NO decorative flourishes, NO double lines, NO second inset rectangle inside the first — if you start to draw a second one, stop. Keep all artwork inside this outline with ~4% buffer; nothing touches or crosses it. Identical position and thickness on every page in the book.";

// New rule used by the master coloring-page prompt: explicitly forbid the
// AI from drawing ANY border, frame, or rectangular outline at the page
// edge. The printable border is added at PDF-assembly time as a vector
// rectangle (lib/pdf.ts) — that's deterministic, identical on every page,
// and free of the "two borders" / "double line" failure mode that plagued
// the AI-drawn version. With this rule active, Gemini fills its canvas
// edge-to-edge with line art only; pdf-lib stamps the printer border on
// top during download.
export const NO_AI_BORDER_RULE =
  "RULE #1 — READ THIS FIRST AND OBEY. The page MUST BE BORDERLESS. Do NOT draw a rectangular border. Do NOT draw a page outline. Do NOT draw a printer's frame. Do NOT draw a thin black rectangle at 3% / 4% / 5% / any inset from the page edges. Do NOT draw ANY rectangle, frame, outline, or printer's mark anywhere — even faintly, even in the corners. ALSO — do NOT compose a decorative-frame effect using ARTWORK ELEMENTS along the four edges: do NOT line up trees along both vertical edges to form a 'forest archway frame'; do NOT line up bushes / ferns / grass along all four edges to form a 'jungle vignette frame'; do NOT place vines or branches that loop around the canvas perimeter; do NOT use leaves / foliage / clouds that wrap continuously along the top edge and continue down both sides. Trees, ferns, foliage, and rocks MAY appear in the scene as natural environment, but they MUST be DISTRIBUTED ASYMMETRICALLY (e.g. one tree on the left, two ferns at bottom-right, sky open elsewhere) — never balanced as a wreath / archway / mirrored frame around the central subject. The page is COMPLETELY BORDERLESS: no rectangular line frame AND no decorative-archway pseudo-frame. The printer's vector border is added in POST-PROCESSING after you finish; any border you draw or compose produces a DOUBLE BORDER on the printed page. Before submitting the image, scan the four edges and four corners: if you see ANY straight line forming a rectangle near the edges, OR a symmetric wreath of foliage forming a frame, REMOVE the offending elements and re-distribute foliage asymmetrically. Only natural scene content, never a frame. ZERO frame. ZERO border. ZERO archway-vignette. ZERO outline rectangle.";

// Locks the LOOK of common scene elements when (and only when) they actually
// belong in the scene. Critically does NOT mandate that they appear — only
// describes how to draw them IF the scene calls for them. Without this
// "IF/ONLY" framing, Gemini was adding sun+clouds to every page including
// underwater, indoor, space, and night scenes.
export const COMMON_ELEMENT_STYLE =
  "STYLE LOCK FOR COMMON ELEMENTS — STRICT. Do NOT add default backdrop elements just because they are common in coloring books. Add sun, sky, clouds, moon, stars, ground, plants, roads, mountains, hills, fences, buildings, or other scenery ONLY when the page subject, the shared scene description, or the subject's real environment calls for them. Indoor scenes use indoor surroundings. Underwater scenes use aquatic surroundings. Space or night scenes do not include a sun. Plain object pages may stay simple if no environment is needed. Never draw BOTH a sun AND a moon in the same scene. When a common element is appropriate, keep it simple, readable, and background-only: no faces, no expressions, no character-like features, and no extra detail that competes with the main subject. No dramatic god-rays, no volumetric sun beams, no light shafts cutting across the canvas — those are added by default in too many forest / room scenes; render lighting as gentle ambient warm tone instead. No man-made structures (fences, signs, posts, market stalls, lamp-posts, railings, walls, gates, buildings) unless the page brief explicitly names them — a forest scene is pure forest, a meadow scene is pure meadow.";

// Signature-element usage cap — prevents the book's titular element (the
// bluebells in "Pippa and the Lost Map", the snowflakes in a winter book,
// the daisies in a daisy book) from carpeting every page. Without this
// cap the model defaults to "the cover has bluebells → put bluebells on
// every page" which makes every scene look the same.
export const SIGNATURE_ELEMENT_USAGE_RULE =
  "SIGNATURE ELEMENT USAGE CAP — STRICT. If the book's title, palette name, or cover scene features a specific plant, flower, animal, weather, or motif (bluebells, daisies, ferns, mushrooms, sunflowers, butterflies, snowflakes, balloons, kites, etc.), that element is the book's signature. It MAY appear as a small accent on a page that explicitly calls for it (1-3 instances at the edge of the frame, OR 5-10% of canvas area), but it MUST NOT carpet the canvas of every scene, MUST NOT line the bottom strip of every page, and MUST NOT appear at all on pages whose brief doesn't name it. Pick presence from THIS page's brief. If the brief doesn't name the signature element, leave the page without it — at least 30% of the book's pages must have ZERO signature element visible.";

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
