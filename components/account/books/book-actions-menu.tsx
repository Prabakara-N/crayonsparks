"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  FileArchive,
  Loader2,
  MoreVertical,
  Trash2,
} from "lucide-react";

export interface BookActionsMenuProps {
  onDownloadPdf: () => void;
  onDownloadZip: () => void;
  onDelete: () => void;
  pdfBuilding?: boolean;
  zipBuilding?: boolean;
  deleting?: boolean;
  extraItems?: React.ReactNode;
}

export function BookActionsMenu({
  onDownloadPdf,
  onDownloadZip,
  onDelete,
  pdfBuilding = false,
  zipBuilding = false,
  deleting = false,
  extraItems,
}: BookActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(
    null,
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setAnchor({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const busy = pdfBuilding || zipBuilding || deleting;

  function pick(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <>
      <MenuTrigger
        ref={buttonRef}
        onClick={() => !busy && setOpen((v) => !v)}
        busy={busy}
        open={open}
      />

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && anchor && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                role="menu"
                style={{
                  position: "fixed",
                  top: anchor.top,
                  right: anchor.right,
                  zIndex: 1000,
                }}
                className="w-72 rounded-xl bg-zinc-950 border border-white/15 shadow-2xl shadow-black/60 overflow-hidden"
              >
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => pick(onDownloadPdf)}
                  disabled={pdfBuilding}
                  className="w-full flex items-start gap-3 px-3.5 py-2.5 text-left hover:bg-white/5 disabled:opacity-60"
                >
                  {pdfBuilding ? (
                    <Loader2 className="w-4 h-4 mt-0.5 shrink-0 animate-spin text-violet-300" />
                  ) : (
                    <Download className="w-4 h-4 mt-0.5 shrink-0 text-violet-300" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">
                      Download print package
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      KDP cover, KDP interior, Etsy A4 — 3 PDFs in one zip
                    </div>
                  </div>
                </button>

                <div className="border-t border-white/10" />

                <button
                  role="menuitem"
                  type="button"
                  onClick={() => pick(onDownloadZip)}
                  disabled={zipBuilding}
                  className="w-full flex items-start gap-3 px-3.5 py-2.5 text-left hover:bg-white/5 disabled:opacity-60"
                >
                  {zipBuilding ? (
                    <Loader2 className="w-4 h-4 mt-0.5 shrink-0 animate-spin text-cyan-300" />
                  ) : (
                    <FileArchive className="w-4 h-4 mt-0.5 shrink-0 text-cyan-300" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">
                      Download as ZIP
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Individual PNG files for every page + covers
                    </div>
                  </div>
                </button>

                {extraItems && (
                  <>
                    <div className="border-t border-white/10" />
                    {extraItems}
                  </>
                )}

                <div className="border-t border-white/10" />

                <button
                  role="menuitem"
                  type="button"
                  onClick={() => pick(onDelete)}
                  disabled={deleting}
                  className="w-full flex items-start gap-3 px-3.5 py-2.5 text-left hover:bg-red-500/10 disabled:opacity-60"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 mt-0.5 shrink-0 animate-spin text-red-300" />
                  ) : (
                    <Trash2 className="w-4 h-4 mt-0.5 shrink-0 text-red-300" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-red-200">
                      Delete book
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Permanently remove this book from your library
                    </div>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

const MenuTrigger = forwardRef<
  HTMLButtonElement,
  { onClick: () => void; busy: boolean; open: boolean }
>(function MenuTrigger({ onClick, busy, open }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label="Book actions"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900/60 border border-white/10 text-neutral-300 hover:bg-white/5 hover:text-white disabled:opacity-60 transition-colors"
      disabled={busy}
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MoreVertical className="w-4 h-4" />
      )}
    </button>
  );
});
