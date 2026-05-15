"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "motion/react";

interface PlaygroundModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function PlaygroundModal({
  open,
  onClose,
  children,
}: PlaygroundModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>{children}</AnimatePresence>,
    document.body,
  );
}
