"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wand2,
  Coins,
  Activity,
  Megaphone,
  MessageSquare,
  ScrollText,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type { User } from "firebase/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/generations", label: "Generations", icon: Wand2 },
  { href: "/admin/credits", label: "Credits", icon: Coins },
  { href: "/admin/costs", label: "Costs", icon: Activity },
  { href: "/admin/referrals", label: "Referrals", icon: Megaphone },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
];

interface AdminSidebarProps {
  user: User;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const initials = (user.displayName || user.email || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon" className="top-16 h-[calc(100svh-4rem)]">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-500/30">
            <Shield className="h-4 w-4 text-amber-300" />
          </span>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden min-w-0">
            <span className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300/90">
              Admin Console
            </span>
            <span className="truncate text-[10px] text-muted-foreground">
              Restricted access
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" &&
                  pathname?.startsWith(`${item.href}/`));
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.label}
                    className="relative data-[active=true]:bg-white/5 data-[active=true]:text-white data-[active=true]:hover:bg-white/8"
                  >
                    <Link href={item.href}>
                      {active && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-amber-400"
                        />
                      )}
                      <Icon
                        className={
                          active ? "text-amber-300" : "text-muted-foreground"
                        }
                      />
                      <span className={active ? "font-semibold" : ""}>
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.photoURL ?? undefined} alt="" />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden min-w-0">
            <span className="truncate text-xs font-medium">
              {user.displayName ?? user.email}
            </span>
            {user.displayName && (
              <span className="truncate text-[10px] text-muted-foreground">
                {user.email}
              </span>
            )}
          </div>
        </div>
        <div className="px-2 pb-1 group-data-[collapsible=icon]:hidden">
          <SignOutButton className="w-full text-xs" />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
