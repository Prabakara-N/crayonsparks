"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { User } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { AdminSidebar } from "./admin-sidebar";

interface AdminMobileDrawerProps {
  user: User;
  open: boolean;
  onClose: () => void;
}

export function AdminMobileDrawer({
  user,
  open,
  onClose,
}: AdminMobileDrawerProps) {
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
            className="fixed inset-0 z-[59] bg-black/70 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 left-0 z-[60] w-[85vw] max-w-[18rem] p-3 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
          >
            <div className="relative h-full">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close admin menu"
                className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/15 flex items-center justify-center text-neutral-300 hover:text-white shadow-lg shadow-black/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <AdminSidebar user={user} onNavigate={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
