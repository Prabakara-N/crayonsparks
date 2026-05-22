"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/hooks/use-user";
import { UserMenu } from "./user-menu";

export function AuthNavSlot() {
  const { user, loading } = useUser();
  const pathname = usePathname();

  if (loading) {
    return <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" aria-hidden />;
  }

  if (user) {
    return <UserMenu user={user} />;
  }

  const next = encodeURIComponent(pathname || "/");
  return (
    <Link
      href={`/login?next=${next}`}
      className="px-4 py-1.5 text-sm font-semibold text-white rounded-full bg-linear-to-r from-violet-500 to-cyan-400 hover:opacity-95 transition-opacity"
    >
      Get Started
    </Link>
  );
}
