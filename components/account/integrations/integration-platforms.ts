import type { IntegrationPlatform } from "@/lib/hooks/use-integrations";

export interface IntegrationPlatformMeta {
  id: IntegrationPlatform;
  name: string;
  description: string;
  /** false → connection flow not built yet; card shows "Coming soon". */
  available: boolean;
}

export const INTEGRATION_PLATFORMS: IntegrationPlatformMeta[] = [
  {
    id: "gumroad",
    name: "Gumroad",
    description:
      "Publish finished books straight to your Gumroad store as digital products.",
    available: true,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    description:
      "Auto-pin your covers and mockups to drive traffic to your listings.",
    available: false,
  },
  {
    id: "etsy",
    name: "Etsy",
    description: "List your coloring and story books in your Etsy shop.",
    available: false,
  },
];
