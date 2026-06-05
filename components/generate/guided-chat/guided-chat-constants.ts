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
      "Hi, I'm Sparky AI ✨ I turn ideas into full-color story books — classic fables (Aesop, Panchatantra, Grimm) or your own original story. Say hi or share a story idea.",
    placeholders: [
      "The Tortoise and the Hare…",
      "Goldilocks and the Three Bears…",
      "A brave little firefly looking for friends…",
      "The Three Little Pigs…",
      "A pirate kitten searching for buried fish…",
      "Jack and the Beanstalk…",
    ],
    quickStarts: [
      "Give me a classic fable I can turn into a story book",
      "Show me popular bedtime-story ideas",
      "Help me build an original kids' story book",
    ],
  },
  activity: {
    greeting:
      "Hi, I'm Sparky AI ✨ I plan printable activity books — mazes, dot-to-dot, word search, tracing, counting, color-by-number and more. Tell me a theme and the age.",
    placeholders: [
      "Space adventure for ages 5-8…",
      "Dinosaurs with mazes and counting…",
      "Numbers & counting 1-20 for toddlers…",
      "Ocean animals seek-and-find…",
      "Big brain-games book for ages 8-12…",
      "Farm animals tracing and matching…",
    ],
    quickStarts: [
      "Plan a space activity book for ages 5-8",
      "Suggest an activity-book theme that sells on KDP",
      "Build a numbers & letters workbook for toddlers",
    ],
  },
};

export interface BookTypeOption {
  mode: Mode;
  label: string;
  description: string;
}

export const BOOK_TYPE_INTRO =
  "Hi, I'm Sparky AI ✨ I can plan three kinds of kids' books. Which one are we making today?";

export const BOOK_TYPE_OPTIONS: BookTypeOption[] = [
  {
    mode: "qa",
    label: "Coloring book",
    description: "B&W line art — one subject per page, kids color it in",
  },
  {
    mode: "story",
    label: "Story book",
    description: "Full-color picture story with characters & speech bubbles",
  },
  {
    mode: "activity",
    label: "Activity book",
    description: "Mazes, dot-to-dot, tracing, puzzles & more",
  },
];

export const TYPE_ANSWER_PLACEHOLDERS = [
  "Type your answer…",
  "Tell me more…",
  "Add details…",
];
