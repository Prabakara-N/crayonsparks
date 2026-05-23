"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: string;
  onClick?: () => void;
}

export function AdminSidebarLink({
  href,
  icon: Icon,
  label,
  badge,
  onClick,
}: AdminSidebarLinkProps) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (href !== "/admin" && pathname?.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-white/8 text-white shadow-inner shadow-black/20"
          : "text-neutral-400 hover:text-white hover:bg-white/5",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-amber-400"
        />
      )}
      <Icon
        className={cn(
          "w-4 h-4 shrink-0 transition-colors",
          active ? "text-amber-300" : "text-neutral-500",
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-full px-1.5 py-0.5">
          {badge}
        </span>
      )}
    </Link>
  );
}
