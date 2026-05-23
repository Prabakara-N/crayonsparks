"use client";

import { X } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarMobileClose() {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  if (!isMobile || !openMobile) return null;
  return (
    <button
      type="button"
      onClick={() => setOpenMobile(false)}
      aria-label="Close menu"
      className="fixed top-3 right-3 z-[55] flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/15 text-neutral-200 hover:bg-zinc-800 hover:text-white shadow-lg shadow-black/40 transition-colors md:hidden"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
