"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Shield, Coins } from "lucide-react";
import type { User } from "firebase/auth";
import { orpc } from "@/lib/orpc/client";
import { getPlanById } from "@/lib/billing/plans";
import { onCreditsChanged } from "@/lib/credits-events";
import { UserAvatar } from "./user-avatar";
import { SignOutButton } from "./sign-out-button";

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    orpc.auth
      .me()
      .then((res) => {
        if (!cancelled) setIsAdmin(res.isAdmin);
      })
      .catch(() => {
        // signed-out / error — hide the admin link
      });
    return () => {
      cancelled = true;
    };
  }, [user.uid]);

  const loadSummary = useCallback(() => {
    orpc.billing
      .summary()
      .then((res) => {
        setCredits(res.creditsBalance);
        setPlanName(getPlanById(res.planId).name);
      })
      .catch(() => {
        // leave as null — the row shows a dash
      });
  }, []);

  // Refresh on mount, whenever the menu opens, on window focus, and whenever a
  // generation reports it spent credits — so the balance never shows stale.
  useEffect(() => {
    loadSummary();
  }, [user.uid, loadSummary]);

  useEffect(() => {
    if (open) loadSummary();
  }, [open, loadSummary]);

  useEffect(() => {
    const onFocus = () => loadSummary();
    window.addEventListener("focus", onFocus);
    const off = onCreditsChanged(loadSummary);
    return () => {
      window.removeEventListener("focus", onFocus);
      off();
    };
  }, [loadSummary]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const accountLabel =
    user.displayName?.trim() || user.email || "Account menu";

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${accountLabel}`}
        className="inline-flex h-10 w-10 mt-1 items-center justify-center rounded-full ring-1 ring-white/15 hover:ring-white/40 focus:outline-none focus:ring-2 focus:ring-violet-400/60 transition"
      >
        <UserAvatar user={user} size={36} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-2 w-64 rounded-xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
        >
          <div className="flex items-center gap-3 px-3 py-3 border-b border-white/10">
            <UserAvatar user={user} size={40} />
            <div className="min-w-0 flex-1">
              {user.displayName && (
                <p className="text-sm font-semibold text-white truncate">
                  {user.displayName}
                </p>
              )}
              <p className="text-xs text-neutral-400 truncate">{user.email}</p>
            </div>
          </div>

          <Link
            href="/account/billing"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-2 mx-2 my-2 px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <span className="inline-flex items-center gap-1.5 text-sm text-neutral-300">
              <Coins className="w-4 h-4 text-amber-300" />
              <span className="font-semibold text-white">
                {credits === null ? "—" : credits.toLocaleString()}
              </span>
              credits
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-violet-500/20 border border-violet-500/40 text-violet-100">
              {planName ?? "—"}
            </span>
          </Link>

          <div className="px-2 py-1.5 border-t border-white/10">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-neutral-200 hover:bg-white/5 hover:text-white"
            >
              <LayoutDashboard className="w-4 h-4" />
              Account dashboard
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-amber-200 hover:bg-amber-500/10 hover:text-amber-100"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>
          <div className="border-t border-white/10 px-2 py-1.5">
            <SignOutButton
              onAfter={() => setOpen(false)}
              className="w-full px-2 py-1.5 rounded-md hover:bg-red-500/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
