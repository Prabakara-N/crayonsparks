"use client";

import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Settings,
} from "lucide-react";
import type { User } from "firebase/auth";
import { AccountUserBlock } from "./account-user-block";
import { AccountSidebarLink } from "./account-sidebar-link";
import { SignOutButton } from "@/components/auth/sign-out-button";

interface AccountSidebarProps {
  user: User;
  onNavigate?: () => void;
}

export function AccountSidebar({ user, onNavigate }: AccountSidebarProps) {
  return (
    <aside className="h-full flex flex-col bg-zinc-950/80 border border-white/10 rounded-2xl overflow-hidden">
      <AccountUserBlock user={user} />

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <AccountSidebarLink
          href="/account"
          icon={LayoutDashboard}
          label="Dashboard"
          onClick={onNavigate}
        />
        <AccountSidebarLink
          href="/account/books"
          icon={BookOpen}
          label="My Books"
          badge="Soon"
          onClick={onNavigate}
        />
        <AccountSidebarLink
          href="/account/billing"
          icon={CreditCard}
          label="Billing"
          badge="Soon"
          onClick={onNavigate}
        />
        <AccountSidebarLink
          href="/account/settings"
          icon={Settings}
          label="Settings"
          badge="Soon"
          onClick={onNavigate}
        />
      </nav>

      <div className="px-3 py-3 border-t border-white/10 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono">
          Account
        </span>
        <SignOutButton
          className="text-xs"
          onAfter={onNavigate}
        />
      </div>
    </aside>
  );
}
