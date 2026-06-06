// Color-by-reference activity: a small FULL-COLOR picture the child matches,
// plus the SAME picture as B&W line art (img2img) for them to color in.

export const COLOR_REFERENCE_COLOR_PROMPT = (opts: {
  theme: string;
  subject: string;
}): string =>
  [
    `Draw ONE simple, friendly full-color cartoon subject for a young child's coloring activity, themed: ${opts.theme}.`,
    `The single subject is: ${opts.subject}. Center it.`,
    "Draw the ENTIRE subject fully inside the frame with generous empty margin on all four sides — no part of the subject may touch or extend past the edges, and nothing may be cropped.",
    "If the subject is a living creature (an animal or a person), a simple friendly face is fine. If the subject is NOT alive (a vehicle, plant, flower, food, or household object), draw it as a plain object with NO face — no eyes, no mouth, no facial features.",
    "Use bright, flat, kid-friendly colors with clean bold black outlines — the colors must be obvious and easy for a child to copy with crayons.",
    "CRITICAL: ONLY the single main subject. PLAIN WHITE background with absolutely NO background scene, NO decorative swirls, sparkles, stars, dots, confetti, frames, or any extra elements around the subject.",
    "Keep it simple: one main subject, few distinct color areas, nothing tiny or fiddly.",
    "No text, no numbers, no border, no watermark. 1:1 square, print quality.",
  ].join("\n");

export const COLOR_REFERENCE_BW_PROMPT = (): string =>
  [
    "Redraw the provided color picture EXACTLY — same single subject, same shapes, same composition, same outlines — but as PURE BLACK-AND-WHITE line art with ABSOLUTELY NO color anywhere.",
    "Every area that was colored becomes plain WHITE inside, bounded by the same bold black outline, so a child can color it to match the original.",
    "Remove ALL color from every part of the image including any background decorations — the entire picture must be black outlines on pure white, nothing coloured, tinted, shaded or grey.",
    "Do NOT add, remove, move, or restyle anything — keep it line-for-line identical to the source, only with all color removed.",
    "Bold clean black outlines on pure white. No text, no numbers, no border. 1:1 square, print quality.",
  ].join("\n");
