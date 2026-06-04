// Prompt for the small picture cue on a letter-tracing page ("A is for Apple").
// One clean object the child colors, generated per book theme so the cue stays
// on-theme (an ocean book draws an Anchor for A, not a generic apple).
export const LETTER_REFERENCE_PROMPT = (opts: {
  letter: string;
  word: string;
  theme: string;
}): string => {
  return [
    `Draw ONE simple, cheerful black-and-white line-art picture of a single ${opts.word} for a kids' alphabet tracing worksheet (theme: ${opts.theme}).`,
    "Exactly one object, centered, filling most of the frame, friendly and instantly recognizable to a young child.",
    "Style: clean bold black outlines on pure white, no shading, no grey fills, no color.",
    "Absolutely NO text, NO letters, NO numbers, NO labels, NO border or frame. 1:1 square, print quality.",
  ].join("\n");
};
