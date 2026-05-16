"use client";

import {
  LayoutDashboard,
  Users,
  Wand2,
  Coins,
  Activity,
  ScrollText,
  Shield,
} from "lucide-react";
import type { User } from "firebase/auth";
import { AccountUserBlock } from "@/components/account/account-user-block";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminSidebarLink } from "./admin-sidebar-link";

interface AdminSidebarProps {
  user: User;
  onNavigate?: () => void;
}

export function AdminSidebar({ user, onNavigate }: AdminSidebarProps) {
  return (
    <aside className="h-full flex flex-col bg-zinc-950/80 border border-amber-500/30 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border-b border-amber-500/30">
        <Shield className="w-4 h-4 text-amber-300" />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-200">
          Admin
        </span>
      </div>
      <AccountUserBlock user={user} />

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <AdminSidebarLink
          href="/admin"
          icon={LayoutDashboard}
          label="Overview"
          onClick={onNavigate}
        />
        <AdminSidebarLink
          href="/admin/users"
          icon={Users}
          label="Users"
          onClick={onNavigate}
        />
        <AdminSidebarLink
          href="/admin/generations"
          icon={Wand2}
          label="Generations"
          badge="Soon"
          onClick={onNavigate}
        />
        <AdminSidebarLink
          href="/admin/credits"
          icon={Coins}
          label="Credits"
          badge="Soon"
          onClick={onNavigate}
        />
        <AdminSidebarLink
          href="/admin/costs"
          icon={Activity}
          label="Costs"
          badge="Soon"
          onClick={onNavigate}
        />
        <AdminSidebarLink
          href="/admin/audit"
          icon={ScrollText}
          label="Audit log"
          onClick={onNavigate}
        />
      </nav>

      <div className="px-3 py-3 border-t border-white/10 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono">
          Admin
        </span>
        <SignOutButton className="text-xs" onAfter={onNavigate} />
      </div>
    </aside>
  );
}
