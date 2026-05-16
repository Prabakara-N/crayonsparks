"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "./use-user";

export function useRequireAuth() {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = encodeURIComponent(pathname || "/playground");
      router.replace(`/login?next=${next}`);
    }
  }, [loading, user, router, pathname]);

  return { user, loading };
}
