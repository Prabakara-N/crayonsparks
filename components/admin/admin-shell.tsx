"use client";

import type { ReactNode } from "react";
import { useRequireAdmin } from "@/lib/hooks/use-require-admin";
import { ShellSkeleton } from "@/components/ui/shell-skeleton";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { SidebarMobileClose } from "@/components/ui/sidebar-mobile-close";
import { AdminSidebar } from "./admin-sidebar";
import { AdminMobileHeader } from "./admin-mobile-header";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { user, loading, isAdmin } = useRequireAdmin();

  if (loading || !user || !isAdmin) {
    return <ShellSkeleton />;
  }

  return (
    <div className="pt-16">
      <SidebarProvider defaultOpen>
        <AdminSidebar user={user} />
        <SidebarMobileClose />
        <SidebarInset className="bg-transparent">
          <AdminMobileHeader title="Admin" />
          <main className="px-4 sm:px-6 lg:px-8 py-6 md:py-10 max-w-6xl mx-auto w-full">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
