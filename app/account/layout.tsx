import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from "@/components/ui/navbar";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = {
  title: "Account",
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <AccountShell>{children}</AccountShell>
    </>
  );
}
