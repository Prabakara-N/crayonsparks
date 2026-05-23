/* eslint-disable @next/next/no-img-element */
import type { IntegrationPlatform } from "@/lib/hooks/use-integrations";

interface PlatformIconProps {
  platform: IntegrationPlatform;
  className?: string;
}

const ICON_SRC: Record<IntegrationPlatform, string> = {
  pinterest: "/integrations/pinterest.png",
  etsy: "/integrations/etsy.png",
  gumroad: "/integrations/gumroad.png",
};

const ALT_TEXT: Record<IntegrationPlatform, string> = {
  pinterest: "Pinterest",
  etsy: "Etsy",
  gumroad: "Gumroad",
};

export function PlatformIcon({ platform, className }: PlatformIconProps) {
  return (
    <img
      src={ICON_SRC[platform]}
      alt={ALT_TEXT[platform]}
      className={`object-contain ${className ?? ""}`}
      draggable={false}
    />
  );
}

export const PLATFORM_BRAND_COLORS: Record<
  IntegrationPlatform,
  { bg: string; border: string }
> = {
  pinterest: {
    bg: "bg-[#E60023]/12",
    border: "border-[#E60023]/40",
  },
  etsy: {
    bg: "bg-[#F1641E]/12",
    border: "border-[#F1641E]/40",
  },
  gumroad: {
    bg: "bg-[#FF90E8]/15",
    border: "border-[#FF90E8]/40",
  },
};
