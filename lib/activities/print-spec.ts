// KDP + Etsy print specs for the activity book, sourced from official KDP help
// pages and printable-seller best practice. One source of truth for the layout
// engine and export. Logical activity SVGs are 100 units = 1 inch.
export const PRINT = {
  unitsPerInch: 100,
  trim: { wIn: 8.5, hIn: 11 },
  dpi: 300,
  letterPx: { w: 2550, h: 3300 },
  a4Px: { w: 2480, h: 3508 },
  bleedIn: 0.125,
  safeMarginIn: 0.5,
  gutterIn: 0.375,
  spineFactorPerPage: 0.002252,
  minPages: 24,
} as const;
