"use client";

import type { ReactNode } from "react";
import { useRequireAuth } from "@/lib/hooks/use-require-auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarMobileClose } from "@/components/ui/sidebar-mobile-close";
import { AccountSidebar } from "./account-sidebar";
import { AccountShellSkeleton } from "./account-shell-skeleton";
import { AccountMobileHeader } from "./account-mobile-header";

interface AccountShellProps {
  children: ReactNode;
}

export function AccountShell({ children }: AccountShellProps) {
  const { user, loading } = useRequireAuth();

  if (loading || !user) {
    return <AccountShellSkeleton />;
  }

  return (
    <div className="pt-16">
      <SidebarProvider defaultOpen>
        <AccountSidebar user={user} />
        <SidebarMobileClose />
        <SidebarInset className="bg-transparent">
          <AccountMobileHeader title="Account" />
          <main className="px-4 sm:px-6 lg:px-8 py-6 md:py-10 max-w-6xl mx-auto w-full">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
