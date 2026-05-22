"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { useRequireAdmin } from "@/lib/hooks/use-require-admin";
import { LoadingState } from "@/components/ui/loading-state";
import { AdminSidebar } from "./admin-sidebar";
import { AdminMobileDrawer } from "./admin-mobile-drawer";
import { AdminAuditBanner } from "./admin-audit-banner";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { user, loading, isAdmin } = useRequireAdmin();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState label="Verifying admin access…" />
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <AdminAuditBanner />

        <div className="md:hidden mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">Admin</h1>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open admin menu"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-sm text-amber-100 hover:bg-amber-500/25"
          >
            <Menu className="w-4 h-4" />
            Menu
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
          <div className="hidden md:block md:sticky md:top-28 md:h-[calc(100vh-8rem)]">
            <AdminSidebar user={user} />
          </div>

          <main className="min-w-0">{children}</main>
        </div>
      </div>

      <AdminMobileDrawer
        user={user}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
