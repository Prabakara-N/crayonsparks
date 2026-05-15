import type { Mode, ModeIntro } from "./types";

export const MAX_REFERENCE_BYTES = 6 * 1024 * 1024;
export const ACCEPTED_REFERENCE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const MODE_INTROS: Record<Mode, ModeIntro> = {
  qa: {
    greeting:
      "Hi, I'm Sparky AI ✨ Tell me about the coloring book you'd like to make — or just say hi.",
    placeholders: [
      "Cute jungle animals for toddlers…",
      "Detailed mandala animals for tweens…",
      "Dinosaurs with names and habitats…",
      "Unicorns and rainbows for ages 4-7…",
      "Construction trucks and diggers…",
      "Sea creatures of the deep ocean…",
    ],
    quickStarts: [
      "Suggest a theme that sells on KDP",
      "What are bestselling coloring book niches right now?",
      "Help me plan a unicorn coloring book for ages 4-7",
    ],
  },
  story: {
    greeting:
      "Hi, I'm Sparky AI ✨ I turn stories into coloring books — classic fables (Aesop, Panchatantra, Grimm) or your own ideas. Say hi or tell me a story.",
    placeholders: [
      "The Tortoise and the Hare…",
      "Goldilocks and the Three Bears…",
      "A brave little firefly looking for friends…",
      "The Three Little Pigs…",
      "A pirate kitten searching for buried fish…",
      "Jack and the Beanstalk…",
    ],
    quickStarts: [
      "Give me a classic fable I can turn into a book",
      "Show me popular school-textbook stories",
      "Help me build an original kids' story",
    ],
  },
};

export const TYPE_ANSWER_PLACEHOLDERS = [
  "Type your answer…",
  "Tell me more…",
  "Add details…",
];
