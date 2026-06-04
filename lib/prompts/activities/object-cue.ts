// One clean object as black-and-white line art, embedded into procedural
// activity pages (matching, counting, patterns, sorting) so the pictures are
// theme-rich instead of limited to the small built-in icon set.
export const OBJECT_CUE_PROMPT = (opts: { word: string; theme: string }): string =>
  [
    `Draw ONE simple, cheerful black-and-white line-art picture of a single ${opts.word} for a kids' activity book (theme: ${opts.theme}).`,
    "Exactly one object, centered, filling most of the frame, friendly and instantly recognizable to a young child.",
    "Style: clean bold black outlines on pure white, no shading, no grey fills, no color.",
    "Absolutely NO text, NO letters, NO numbers, NO labels, NO border or frame. 1:1 square, print quality.",
  ].join("\n");

// Exactly N copies of one object, for the number-tracing picture cue
// ("2 is for two apples"). Count integrity is best-effort for small N.
export const NUMBER_CUE_PROMPT = (opts: { n: number; word: string; theme: string }): string =>
  [
    `Draw exactly ${opts.n} identical simple ${opts.word} as black-and-white line art for a kids' counting worksheet (theme: ${opts.theme}).`,
    `There MUST be exactly ${opts.n}, clearly separated and easy to count, arranged neatly in the frame.`,
    "Style: clean bold black outlines on pure white, no shading, no grey fills, no color.",
    "Absolutely NO text, NO letters, NO numbers, NO labels, NO border or frame. 1:1 square, print quality.",
  ].join("\n");
