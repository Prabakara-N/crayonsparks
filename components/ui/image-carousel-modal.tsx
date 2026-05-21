"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface CarouselImage {
  url: string;
  label: string;
}

interface ImageCarouselModalProps {
  open: boolean;
  images: CarouselImage[];
  startIndex: number;
  onClose: () => void;
}

export function ImageCarouselModal({
  open,
  images,
  startIndex,
  onClose,
}: ImageCarouselModalProps) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(startIndex);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  useEffect(() => {
    if (!open || images.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        setIndex((i) => (i - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowRight") {
        setIndex((i) => (i + 1) % images.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length, onClose]);

  if (!mounted) return null;

  const hasMany = images.length > 1;
  const prev = () =>
    setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  return createPortal(
    <AnimatePresence>
      {open && images.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-1000 bg-black/90 backdrop-blur-md flex flex-col"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium truncate">
              {images[index]?.label}
            </span>
            <div className="flex items-center gap-3">
              {hasMany && (
                <span className="text-xs text-neutral-400 font-mono">
                  {index + 1} / {images.length}
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className="relative flex-1 flex items-center justify-center px-4 pb-6 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {hasMany && (
              <button
                type="button"
                onClick={prev}
                aria-label="Previous image"
                className="absolute left-3 md:left-6 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <motion.img
              key={index}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              src={images[index]?.url}
              alt={images[index]?.label}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            />

            {hasMany && (
              <button
                type="button"
                onClick={next}
                aria-label="Next image"
                className="absolute right-3 md:right-6 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {hasMany && (
            <div
              className="flex items-center justify-center gap-1.5 pb-4 px-4 overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to ${img.label}`}
                  className={`shrink-0 w-12 h-16 rounded overflow-hidden border-2 transition-colors ${
                    i === index
                      ? "border-violet-400"
                      : "border-white/15 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
