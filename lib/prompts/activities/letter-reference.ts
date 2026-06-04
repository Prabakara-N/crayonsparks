// Prompt for the small picture cue on a letter-tracing page ("A is for Apple").
// One clean object the child colors, generated per book theme so the cue stays
// on-theme (an ocean book draws an Anchor for A, not a generic apple).
export const LETTER_REFERENCE_PROMPT = (opts: {
  letter: string;
  word: string;
  theme: string;
}): string => {
  return [
    `Draw ONE simple black-and-white line-art picture of a single ${opts.word} for a kids' alphabet tracing worksheet (theme: ${opts.theme}).`,
    "Exactly one object, centered, filling most of the frame, instantly recognizable to a young child.",
    "If the subject is an inanimate object (toy, food, vehicle, household item, shape, plant), draw it plainly with NO face, NO eyes, NO mouth, NO smile and NO arms or legs. Only a real animal or person may have a face.",
    "Style: clean bold black outlines on pure white, no shading, no grey fills, no color.",
    "Absolutely NO text, NO letters, NO numbers, NO labels, NO border or frame. 1:1 square, print quality.",
  ].join("\n");
};
