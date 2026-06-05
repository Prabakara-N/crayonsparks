// Picture 1 — the original scene. Picture 2 (with real changes) and the circled
// answer key are generated from this image. `color` switches between B&W line
// art (default) and a bright full-color scene.
export const SPOT_DIFFERENCE_PROMPT = (opts: {
  theme: string;
  color?: boolean;
}): string =>
  [
    opts.color
      ? `Draw a bright, cheerful full-color cartoon scene for a kids' activity book, themed: ${opts.theme}.`
      : `Draw a clean black-and-white line-art scene for a kids' activity book, themed: ${opts.theme}.`,
    "A single cheerful scene with 6-10 distinct objects and characters spread across the frame, plenty of clear empty space between elements.",
    opts.color
      ? "Style: flat bright kid-friendly colors with clean bold outlines, simple and uncluttered so two copies can be compared easily."
      : "Style: bold black outlines on pure white, no shading, no grey, no color. Simple and uncluttered so two copies can be compared easily.",
    "Fill the frame edge to edge. No text, no numbers, no border. Wide 4:3 landscape composition, print quality.",
  ].join("\n");

// Picture 2 — redraw the provided scene IDENTICALLY but introduce exactly N
// real, visible differences. Used as the img2img instruction with Picture 1
// supplied as the source image.
export const SPOT_DIFFERENCE_CHANGES_PROMPT = (opts: {
  count: number;
  color?: boolean;
}): string =>
  [
    `Redraw the provided scene EXACTLY — same composition, same objects, same positions, same ${opts.color ? "colors and " : ""}line style — but introduce exactly ${opts.count} clear, visible differences.`,
    "Each difference must be obvious enough for a child to spot: add a small object, remove an object, change a shape's pattern, flip a detail, or change how many of something there are.",
    "Do NOT move, redraw, or restyle anything else — every other element must stay pixel-for-pixel as close to the original as possible.",
    opts.color
      ? "Keep the same bright flat full-color cartoon style, no text, no numbers, no border. Same 4:3 landscape framing."
      : "Keep it pure black-and-white line art on white, no shading, no grey, no color, no text, no numbers, no border. Same 4:3 landscape framing.",
  ].join("\n");

// Answer key — the model is given Picture 2 (source) and Picture 1 (extra
// reference) and outputs Picture 2 with each real difference circled in red.
export const SPOT_DIFFERENCE_CIRCLE_PROMPT = (opts: { count: number }): string =>
  [
    "The source image is PICTURE 2. The additional reference image is PICTURE 1 (the original).",
    `Output PICTURE 2 exactly as-is, but draw a clean thin RED circle around each of the ${opts.count} spots where PICTURE 2 differs from PICTURE 1.`,
    "Circle only the genuine differences. Do not add, remove, or alter any part of the scene itself — only overlay the red circles. Keep everything else identical.",
  ].join("\n");
