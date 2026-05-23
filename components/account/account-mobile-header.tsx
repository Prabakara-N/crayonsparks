"use client";

import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

interface AccountMobileHeaderProps {
  title: string;
}

export function AccountMobileHeader({ title }: AccountMobileHeaderProps) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Open menu"
      className="md:hidden w-full flex items-center gap-2 px-4 py-3 border-b border-white/10 text-left hover:bg-white/5 transition-colors"
    >
      <PanelLeft className="h-4 w-4 text-neutral-400" />
      <span className="text-sm font-semibold text-white">{title}</span>
    </button>
  );
}
