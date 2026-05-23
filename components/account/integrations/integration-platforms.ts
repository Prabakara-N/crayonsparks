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
      "Auto-pin your covers and sample pages to drive traffic to your listings.",
    available: true,
  },
  {
    id: "etsy",
    name: "Etsy",
    description:
      "Auto-create draft + active listings in your Etsy shop, with cover, PDF and tags.",
    available: true,
  },
];
