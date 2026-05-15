import type { SkeletonFourPlatform, SkeletonTwoRow } from "./types";

export const SKELETON_TWO_ROWS: SkeletonTwoRow[] = [
  {
    key: "row-one",
    offset: "-ml-20",
    covers: [
      "/visuals/covers/farm-animals.png",
      "/visuals/covers/playful-dinosaurs.png",
      "/visuals/covers/woodland-baby-animals.png",
      "/visuals/covers/wild-animals.png",
      "/visuals/covers/sea-creatures.png",
    ],
  },
  {
    key: "row-two",
    offset: "",
    covers: [
      "/visuals/covers/birds.png",
      "/visuals/covers/insects-bugs.png",
      "/visuals/covers/mighty-heroes.png",
      "/visuals/covers/halloween.png",
      "/visuals/covers/alphabet.png",
    ],
  },
  {
    key: "row-three",
    offset: "-ml-12",
    covers: [
      "/visuals/covers/toybox-favorites.png",
      "/visuals/covers/fruits.png",
      "/visuals/covers/vehicles.png",
      "/visuals/covers/happy-farm-animals.jpg",
    ],
  },
  {
    key: "row-four",
    offset: "-ml-8",
    covers: [
      "/visuals/covers/toys-coloring-book.png",
      "/visuals/covers/sea-creatures.png",
    ],
  },
];

export const SKELETON_FOUR_PLATFORMS: SkeletonFourPlatform[] = [
  {
    name: "Amazon KDP",
    url: "https://kdp.amazon.com",
    gradient: "from-violet-400 via-indigo-300 to-cyan-300",
    detail:
      "Paperback interior + cover + metadata ZIP. SEO title under 200 chars, 7 backend keywords, KDP-taxonomy categories.",
  },
  {
    name: "Etsy",
    url: "https://www.etsy.com/market/coloring_book",
    gradient: "from-rose-400 to-orange-300",
    detail:
      "Digital download listing via Etsy Open API v3 — SEO-tuned title, 13 tags, instant delivery.",
  },
  {
    name: "Gumroad",
    url: "https://gumroad.com",
    gradient: "from-pink-400 to-fuchsia-300",
    detail:
      "One-click digital product. Instant payouts, built-in email capture, your own /free/[slug] lead-magnet page.",
  },
  {
    name: "Pinterest",
    url: "https://pinterest.com",
    gradient: "from-red-400 to-rose-400",
    detail:
      "10 pin variants per book auto-scheduled across 30 days. UTM-tagged links route back to KDP / Etsy / Gumroad.",
  },
];
