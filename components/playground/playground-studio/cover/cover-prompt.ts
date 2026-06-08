import type { CoverSelling } from "./cover-brief-types";

// Genre-agnostic FRONT cover art prompt for /api/generate raw mode. The book
// title is added later as an editable overlay, so the art must contain NO
// title/author lettering. When `selling` is provided the AI bakes marketing
// badges (age band, count seal, selling strip, plaque) directly into the art.
export function buildFrontCoverPrompt(opts: {
  title: string;
  description: string;
  selling?: CoverSelling;
}): string {
  const title = opts.title.trim();
  const description = opts.description.trim();
  const lines = [
    "Design a professional, eye-catching FRONT BOOK COVER illustration.",
    title ? `Book title for context only (do NOT draw it): "${title}".` : "",
    description
      ? `What the book is about: ${description}`
      : title
        ? "No description was given — infer a fitting subject, genre, and mood from the title alone."
        : "Infer a fitting subject, genre, and mood for a general book cover.",
    "Choose the art style, palette, mood, and composition that best fit this book's genre and audience — this is NOT limited to children's books; match whatever the title/description implies (thriller, romance, fantasy, business, cookbook, kids, etc.).",
    "Full-bleed cover artwork that fills the whole frame, one strong focal subject, balanced composition that leaves some calm space where a title could sit.",
  ];

  if (hasSelling(opts.selling)) {
    lines.push(sellingInstruction(opts.selling));
    lines.push(
      "Render the marketing badge/strip/plaque text described above CLEANLY and correctly spelled, styled to match the cover's genre. Render NO book title and NO author name — those are added separately.",
    );
  } else {
    lines.push(
      "CRITICAL: render NO text, NO letters, NO words, NO numbers, NO title and NO author name anywhere — text is added separately. Pure illustration or photographic art only.",
    );
  }

  lines.push(
    "No borders, no 3D book mockup, no frame — just the flat cover artwork. Print quality.",
  );

  return lines.filter(Boolean).join("\n");
}

function hasSelling(s?: CoverSelling): s is CoverSelling {
  return (
    !!s &&
    (!!s.ageBand ||
      !!s.countBadge ||
      s.stripPhrases.length > 0 ||
      s.plaqueLines.length > 0)
  );
}

function sellingInstruction(s: CoverSelling): string {
  const parts: string[] = [
    "Bake genre-appropriate SELLING ELEMENTS into the artwork, integrated tastefully so they do not crowd the focal subject:",
  ];
  if (s.ageBand) {
    parts.push(
      `- a top banner ribbon reading exactly "${s.ageBand}".`,
    );
  }
  if (s.countBadge) {
    parts.push(
      `- a round seal/badge in a top corner reading exactly "${s.countBadge}".`,
    );
  }
  if (s.stripPhrases.length > 0) {
    parts.push(
      `- a bottom strip with one ALL-CAPS line of selling phrases separated by small star/dot accents: "${s.stripPhrases.join(" ★ ")}".`,
    );
  }
  if (s.plaqueLines.length > 0) {
    parts.push(
      `- a small angled corner plaque/sticker reading: "${s.plaqueLines.join(" ")}".`,
    );
  }
  return parts.join("\n");
}
