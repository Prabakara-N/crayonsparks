"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { User } from "firebase/auth";
import { orpc } from "@/lib/orpc/client";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const BASE_NAV_ITEMS: NavItem[] = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/books", label: "My Books", icon: BookOpen },
  { href: "/account/billing", label: "Billing", icon: CreditCard },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/account/integrations", label: "Integrations", icon: Store },
];

interface AccountSidebarProps {
  user: User;
}

export function AccountSidebar({ user }: AccountSidebarProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const [isAdmin, setIsAdmin] = useState(false);
  const initials = (user.displayName || user.email || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    let cancelled = false;
    orpc.auth
      .me()
      .then((res) => {
        if (!cancelled) setIsAdmin(Boolean(res.isAdmin));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const navItems = isAdmin
    ? [...BASE_NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : BASE_NAV_ITEMS;

  return (
    <Sidebar collapsible="icon" className="top-16 h-[calc(100svh-4rem)]">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL ?? undefined} alt="" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden min-w-0">
            <span className="truncate text-sm font-semibold">
              {user.displayName ?? user.email}
            </span>
            {user.displayName && (
              <span className="truncate text-[11px] text-muted-foreground">
                {user.email}
              </span>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/account" &&
                  pathname?.startsWith(`${item.href}/`));
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.label}
                    className="data-[active=true]:bg-violet-500/15 data-[active=true]:text-white data-[active=true]:border data-[active=true]:border-violet-500/30 data-[active=true]:hover:bg-violet-500/20"
                  >
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <Icon
                        className={
                          active ? "text-violet-100" : "text-muted-foreground"
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
        <div className="px-2 pb-1 group-data-[collapsible=icon]:hidden">
          <SignOutButton
            className="w-full text-xs"
            onBeforeConfirm={() => {
              if (isMobile) setOpenMobile(false);
            }}
          />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
