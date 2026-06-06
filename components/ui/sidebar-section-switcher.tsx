"use client";

import Link from "next/link";
import { ChevronsUpDown, type LucideIcon } from "lucide-react";
import { SidebarGroupLabel, useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarSectionSwitcherProps {
  label: string;
  href: string;
  itemLabel: string;
  icon: LucideIcon;
}

// Sidebar group label that doubles as a popup to jump to another workspace.
export function SidebarSectionSwitcher({
  label,
  href,
  itemLabel,
  icon: Icon,
}: SidebarSectionSwitcherProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <SidebarGroupLabel className="flex cursor-pointer items-center gap-1 hover:text-foreground transition-colors">
          {label}
          <ChevronsUpDown className="ml-auto h-3 w-3 opacity-70" />
        </SidebarGroupLabel>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isMobile ? "bottom" : "right"}
        align="start"
        sideOffset={8}
        className="z-[60] w-52"
      >
        <DropdownMenuItem asChild>
          <Link
            href={href}
            onClick={() => {
              if (isMobile) setOpenMobile(false);
            }}
          >
            <Icon className="h-4 w-4" />
            {itemLabel}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
