import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from "@/components/ui/navbar";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <AdminShell>{children}</AdminShell>
    </>
  );
}
