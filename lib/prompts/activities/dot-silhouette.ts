// A single solid black silhouette we trace into connect-the-dots points, so
// dot-to-dot can draw ANY on-theme subject. Solid + simple = a clean outline.
export const DOT_SILHOUETTE_PROMPT = (opts: { subject: string; theme: string }): string =>
  [
    `Draw a single SOLID BLACK silhouette of one ${opts.subject} for a kids' connect-the-dots puzzle (theme: ${opts.theme}).`,
    "ONE filled black shape on a pure white background — like a shadow. Completely filled solid black, no interior lines, no outline gaps, no details, no holes.",
    "Bold, simple, chunky proportions instantly recognizable to a young child. Centered, large, filling most of the frame.",
    "No text, no numbers, no extra objects, no shading, no grey, no border. 1:1 square.",
  ].join("\n");
