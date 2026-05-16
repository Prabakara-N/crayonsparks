"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { User } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { AccountSidebar } from "./account-sidebar";

interface AccountMobileDrawerProps {
  user: User;
  open: boolean;
  onClose: () => void;
}

export function AccountMobileDrawer({
  user,
  open,
  onClose,
}: AccountMobileDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 left-0 z-50 w-72 p-3 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Account navigation"
          >
            <div className="relative h-full">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close account menu"
                className="absolute -right-2 top-2 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <AccountSidebar user={user} onNavigate={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
