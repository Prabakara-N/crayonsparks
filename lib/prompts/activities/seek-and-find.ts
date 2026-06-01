// Prompt for the AI base scene of a Seek-and-Find / I-Spy activity page.
export const SEEK_AND_FIND_PROMPT = (opts: {
  theme: string;
  findList: { label: string; count: number }[];
}): string => {
  const items = opts.findList
    .map((f) => `${f.count} ${f.label}`)
    .join(", ");
  return [
    `Draw a busy, cheerful black-and-white line-art search-and-find scene for a kids' activity book, themed: ${opts.theme}.`,
    `The scene MUST clearly contain exactly these countable objects scattered throughout: ${items}.`,
    "Each listed object must be drawn as a distinct, recognizable, separated shape (not overlapping into a blob) so a child can find and count it.",
    "Style: clean bold black outlines on pure white, no shading, no grey fills, NO color of any kind. This is critical: even if an object name contains a color word, draw it as plain black-and-white line art only — never fill or tint any object with that color, or it spoils the search by revealing the target.",
    "Fill the whole frame edge to edge. No text, no numbers, no labels, no border. 3:4 portrait, print quality.",
  ].join("\n");
};
