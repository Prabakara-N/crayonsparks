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
      className="px-4 py-1.5 text-sm font-semibold text-white rounded-full bg-white/10 hover:bg-white/15 border border-white/15 transition-colors"
    >
      Sign in
    </Link>
  );
}
