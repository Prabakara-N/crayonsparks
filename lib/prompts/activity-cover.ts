// Front-cover prompt for a kids' ACTIVITY book (Maze/Puzzle/Workbook style).
// Vibrant colored cover with puzzle motifs and a bold title — distinct from
// the coloring-book cover (no page-count badge / side plaque / bottom strip).

export const ACTIVITY_COVER_PROMPT_TEMPLATE = (opts: {
  title: string;
  scene: string;
  ageLabel?: string;
  theme?: string;
}): string => {
  const ageLine = opts.ageLabel
    ? `Add a small rounded age-band pill reading "FOR KIDS AGES ${opts.ageLabel.toUpperCase()}" beneath the title.`
    : "";
  return [
    "Design a vibrant, professional FRONT COVER for a children's printable ACTIVITY / PUZZLE book sold on Amazon KDP.",
    `Book title (render exactly, large, bold, playful display lettering with a clear outline so it pops): "${opts.title}".`,
    `Theme and scene: ${opts.scene}.`,
    "Surround the title with cheerful puzzle motifs that signal an activity book — winding maze paths, a magnifying glass, a chunky pencil and crayon, dotted connect-the-dot lines, a few jigsaw pieces, small letter and number tiles — arranged as a lively border, not covering the title.",
    "Style: bright saturated colors, friendly rounded cartoon shapes, soft shading, modern children's-book cover quality. Full-bleed colored background to all four edges, no white margin.",
    ageLine,
    "Text policy: the ONLY text is the title and the optional age pill. No author name, no publisher, no barcode, no ISBN, no website, no page count, no marketing blurb anywhere — especially not in the bottom-right corner.",
    "Aspect ratio 3:4 portrait, 300 DPI print quality.",
  ]
    .filter(Boolean)
    .join("\n");
};
