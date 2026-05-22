"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { useRequireAuth } from "@/lib/hooks/use-require-auth";
import { AccountSidebar } from "./account-sidebar";
import { AccountMobileDrawer } from "./account-mobile-drawer";
import { AccountShellSkeleton } from "./account-shell-skeleton";

interface AccountShellProps {
  children: ReactNode;
}

export function AccountShell({ children }: AccountShellProps) {
  const { user, loading } = useRequireAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (loading || !user) {
    return <AccountShellSkeleton />;
  }

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="md:hidden mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">Account</h1>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open account menu"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10"
          >
            <Menu className="w-4 h-4" />
            Menu
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
          <div className="hidden md:block md:sticky md:top-20 md:h-[calc(100vh-6rem)]">
            <AccountSidebar user={user} />
          </div>

          <main className="min-w-0">{children}</main>
        </div>
      </div>

      <AccountMobileDrawer
        user={user}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
