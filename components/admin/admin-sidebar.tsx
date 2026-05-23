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
    <aside className="h-full flex flex-col bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10">
        <span className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Shield className="w-3.5 h-3.5 text-amber-300" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300/90">
            Admin Console
          </p>
          <p className="text-[10px] text-neutral-500 leading-tight">
            Restricted access
          </p>
        </div>
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
          onClick={onNavigate}
        />
        <AdminSidebarLink
          href="/admin/credits"
          icon={Coins}
          label="Credits"
          onClick={onNavigate}
        />
        <AdminSidebarLink
          href="/admin/costs"
          icon={Activity}
          label="Costs"
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
