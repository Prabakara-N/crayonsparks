// Prompt for the AI base scene of a Spot-the-Difference page. We render the
// same scene twice and add the differences procedurally, so the scene just
// needs to be a clean, detailed B&W line drawing.
export const SPOT_DIFFERENCE_PROMPT = (opts: { theme: string }): string =>
  [
    `Draw a clean black-and-white line-art scene for a kids' activity book, themed: ${opts.theme}.`,
    "A single cheerful scene with several distinct objects and characters spread across the frame, plenty of clear empty space between elements.",
    "Style: bold black outlines on pure white, no shading, no grey, no color. Simple and uncluttered so two copies can be compared easily.",
    "Fill the frame edge to edge. No text, no numbers, no border. Wide 4:3 landscape composition, print quality.",
  ].join("\n");
