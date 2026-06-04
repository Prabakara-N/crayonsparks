// Prompt for the AI base line-art of a Color-by-Number activity page.
export const COLOR_BY_NUMBER_PROMPT = (opts: {
  theme: string;
  legend: { n: number; label: string }[];
}): string => {
  const keys = opts.legend.map((l) => `${l.n}=${l.label}`).join(", ");
  return [
    `Draw simple black-and-white color-by-number line art for a kids' activity book, themed: ${opts.theme}.`,
    "Divide the picture into clearly bounded regions with bold black outlines, each region large enough for a small child to color.",
    `Inside each region print a single small number indicating its color from this key: ${keys}. Use only these numbers; repeat them across regions.`,
    "CRITICAL: this is PURE black-and-white line art for the CHILD to color in. Do NOT fill, tint, paint, or shade ANY region with color. Even though the key names colors (red, blue, green, etc.), those are instructions for the child — NEVER render them. Every region stays plain WHITE inside with only its black outline and its small black number.",
    "Style: pure white background, clean black outlines only, no shading, no color fills, no grey. The numbers must be small, centered in their region, and legible.",
    "One friendly central subject with a simple background. No title, no legend box, no border. 3:4 portrait, print quality.",
  ].join("\n");
};
