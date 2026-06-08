import type { AspectRatio, ImageCategory } from "./types";

export const CATEGORIES: { value: ImageCategory; label: string }[] = [
  { value: "generic", label: "Generic — anything goes" },
  { value: "coloring-page", label: "Coloring page (B&W line art)" },
  { value: "sticker", label: "Sticker design" },
  { value: "book-illustration", label: "Children's book illustration" },
  { value: "pinterest-pin", label: "Pinterest pin (9:16)" },
];

export const ASPECTS: { value: AspectRatio; label: string; sub: string }[] = [
  { value: "1:1", label: "Square", sub: "1:1" },
  { value: "3:4", label: "KDP", sub: "3:4" },
  { value: "2:3", label: "Tall", sub: "2:3" },
  { value: "4:3", label: "Landscape", sub: "4:3" },
  { value: "3:2", label: "Wide", sub: "3:2" },
  { value: "9:16", label: "Pin", sub: "9:16" },
  { value: "16:9", label: "Banner", sub: "16:9" },
];

export const QUICK_REFINEMENTS = [
  "Add a decorative border around the page",
  "Remove the sun from the scene",
  "Move the subject to the right side",
  "Add more flowers in the foreground",
  "Make the character look happier",
  "Thicken the outlines for easier coloring",
  "Remove the background, plain white",
  "Add a butterfly in the corner",
];

export const SAMPLE_PROMPTS = [
  "A happy cow standing in a farm field with a barn in the background, rectangular border around the page, coloring book line art",
  "A friendly dinosaur in a jungle with palm trees, decorative border, coloring book page",
  "A smiling astronaut floating among planets and stars, thick outlines, printable coloring page",
  "A unicorn with flowing mane in a magical forest with stars and flowers, coloring book style",
];
