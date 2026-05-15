import type { ListingPlatform } from "@/lib/kdp-metadata";

// Amazon KDP uses a neutral book-stack mark (Amazon's trademark
// guidelines discourage third-party use of the Amazon logo itself).
// Every platform's glyph lives in /public/logos and is recolored at
// render time via CSS mask — see PlatformIcon.
export interface TabConfigEntry {
  id: ListingPlatform;
  label: string;
  logoSrc: string;
  accent: string;
}

export const TAB_CONFIG: ReadonlyArray<TabConfigEntry> = [
  {
    id: "kdp",
    label: "Amazon KDP",
    logoSrc: "/logos/kdp.svg",
    accent: "text-violet-300",
  },
  {
    id: "etsy",
    label: "Etsy",
    logoSrc: "/logos/etsy.svg",
    accent: "text-orange-300",
  },
  {
    id: "gumroad",
    label: "Gumroad",
    logoSrc: "/logos/gumroad.svg",
    accent: "text-pink-300",
  },
  {
    id: "pinterest",
    label: "Pinterest",
    logoSrc: "/logos/pinterest.svg",
    accent: "text-rose-300",
  },
  {
    id: "instagram",
    label: "Instagram",
    logoSrc: "/logos/instagram.svg",
    accent: "text-fuchsia-300",
  },
  {
    id: "twitter",
    label: "X / Twitter",
    logoSrc: "/logos/x.svg",
    accent: "text-sky-300",
  },
];
