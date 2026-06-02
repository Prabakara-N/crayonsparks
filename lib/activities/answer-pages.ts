import { escapeXml, PAGE, SANS, svgDocument } from "./page";

// "Answer Key" divider, rendered as an SVG so it rasterizes to an image and
// needs no embedded PDF font (KDP rejects non-embedded base-14 fonts).
export function answerDividerSvg(): string {
  const cx = PAGE.w / 2;
  const body =
    `<text x="${cx}" y="${PAGE.h / 2 - 6}" text-anchor="middle" font-family="${SANS}" font-size="84" font-weight="700" fill="#111">Answer Key</text>` +
    `<text x="${cx}" y="${PAGE.h / 2 + 48}" text-anchor="middle" font-family="${SANS}" font-size="26" fill="#555">Solutions to the puzzles in this book.</text>`;
  return svgDocument(body);
}

// License / copyright page, rendered as an SVG image for the same reason.
export function licensePageSvg(year: number): string {
  const cx = PAGE.w / 2;
  const lines = [
    `(c) ${year} CrayonSparks. All rights reserved.`,
    "",
    "This activity book is for PERSONAL USE ONLY.",
    "You may print copies for your own family or single classroom.",
    "",
    "You may not resell, redistribute, share, or sell printed",
    "or digital copies, or alter this file in any way.",
    "",
    "Some illustrations were created with AI assistance.",
    "",
    "Made with CrayonSparks - crayonsparks.com",
  ];
  const heading = `<text x="${cx}" y="${PAGE.bodyTop + 70}" text-anchor="middle" font-family="${SANS}" font-size="46" font-weight="700" fill="#111">License &amp; Copyright</text>`;
  let y = PAGE.bodyTop + 180;
  const body = lines
    .map((line) => {
      const el = line
        ? `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="26" fill="#444">${escapeXml(line)}</text>`
        : "";
      y += 46;
      return el;
    })
    .join("");
  return svgDocument(heading + body);
}
