// Color-by-reference activity: a small FULL-COLOR picture the child matches,
// plus the SAME picture as B&W line art (img2img) for them to color in.

export const COLOR_REFERENCE_COLOR_PROMPT = (opts: {
  theme: string;
  subject: string;
}): string =>
  [
    `Draw ONE friendly, simple full-color cartoon picture for a young child's coloring activity, themed: ${opts.theme}.`,
    `The single subject is: ${opts.subject}. Center it on the page, large and clear, with only a minimal simple background.`,
    "Use bright, flat, kid-friendly colors with clean bold black outlines — the colors must be obvious and easy for a child to copy with crayons.",
    "Keep it simple: one main subject, few distinct color areas, nothing tiny or fiddly. Pure white background.",
    "No text, no numbers, no border, no watermark. 1:1 square, print quality.",
  ].join("\n");

export const COLOR_REFERENCE_BW_PROMPT = (): string =>
  [
    "Redraw the provided color picture EXACTLY — same subject, same shapes, same composition, same outlines — but as PURE BLACK-AND-WHITE line art with NO color at all.",
    "Every area that was colored becomes plain WHITE inside, bounded by the same bold black outline, so a child can color it to match the original.",
    "Do NOT add, remove, move, or restyle anything — keep it line-for-line identical to the source, only with the color removed.",
    "Bold clean black outlines on pure white, no shading, no grey, no fills. No text, no numbers, no border. 1:1 square, print quality.",
  ].join("\n");
