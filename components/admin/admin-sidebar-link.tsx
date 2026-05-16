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
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-linear-to-r from-amber-500/20 to-orange-400/10 text-white border border-amber-500/40"
          : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent",
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-full px-1.5 py-0.5">
          {badge}
        </span>
      )}
    </Link>
  );
}
