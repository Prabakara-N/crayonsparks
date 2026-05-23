"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  LayoutDashboard,
  Shield,
  Coins,
  ArrowRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useUser } from "@/lib/hooks/use-user";
import { orpc } from "@/lib/orpc/client";
import { getPlanById } from "@/lib/billing/plans";
import { UserAvatar } from "@/components/auth/user-avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";

export interface MobileNavLink {
  href: string;
  label: string;
}

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  links: MobileNavLink[];
}

export function MobileNavDrawer({
  open,
  onClose,
  links,
}: MobileNavDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    orpc.auth
      .me()
      .then((r) => !cancelled && setIsAdmin(r.isAdmin))
      .catch(() => {});
    orpc.billing
      .summary()
      .then((r) => {
        if (cancelled) return;
        setCredits(r.creditsBalance);
        setPlanName(getPlanById(r.planId).name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
          }}
          exit={{
            opacity: 0,
            transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] },
          }}
          className="fixed inset-0 z-[100] md:hidden"
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{
              x: 0,
              transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
            }}
            exit={{
              x: "100%",
              transition: { duration: 0.4, ease: [0.7, 0, 0.84, 0] },
            }}
            className="absolute inset-0 w-full bg-zinc-950 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 shrink-0">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-mark.svg"
                  alt="CrayonSparks"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-lg shadow-lg shadow-violet-500/30"
                />
                <span className="font-bold text-lg tracking-tight text-white">
                  CrayonSparks
                </span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="p-2 rounded-md text-neutral-300 hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={onClose}
                  className="block px-3 py-3 rounded-lg text-base font-medium text-neutral-200 hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-white/10 p-3 shrink-0">
              {user ? (
                <div>
                  <AnimatePresence initial={false}>
                    {accountOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 pb-2">
                          <Link
                            href="/account/billing"
                            onClick={onClose}
                            className="flex items-center justify-between gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2.5"
                          >
                            <span className="inline-flex items-center gap-1.5 text-sm text-neutral-300">
                              <Coins className="w-4 h-4 text-amber-300" />
                              <span className="font-semibold text-white">
                                {credits === null
                                  ? "—"
                                  : credits.toLocaleString()}
                              </span>
                              credits
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-violet-500/20 border border-violet-500/40 text-violet-100">
                              {planName ?? "—"}
                            </span>
                          </Link>
                          <Link
                            href="/account"
                            onClick={onClose}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-neutral-200 hover:bg-white/5"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Account dashboard
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={onClose}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-amber-200 hover:bg-amber-500/10"
                            >
                              <Shield className="w-4 h-4" />
                              Admin dashboard
                            </Link>
                          )}
                          <SignOutButton
                            onAfter={onClose}
                            className="w-full px-3 py-2.5 rounded-lg hover:bg-red-500/10"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={() => setAccountOpen((v) => !v)}
                    aria-expanded={accountOpen}
                    className="w-full flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/5"
                  >
                    <UserAvatar user={user} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.displayName || "Account"}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    {accountOpen ? (
                      <ChevronDown className="w-5 h-5 text-neutral-400 shrink-0" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-neutral-400 shrink-0" />
                    )}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full text-sm font-semibold text-white bg-linear-to-r from-violet-500 to-cyan-400"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
