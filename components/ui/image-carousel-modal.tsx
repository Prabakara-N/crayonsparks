"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { BubblePreviewOverlay } from "@/components/playground/book-studio/bubble-editor/bubble-preview-overlay";
import type { StoryBubble } from "@/components/playground/book-studio/types";

export interface CarouselImage {
  url: string;
  label: string;
  bubbles?: StoryBubble[];
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

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;

  const activeThumbRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!open) return;
    activeThumbRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [index, open]);

  if (!mounted) return null;

  const hasMany = images.length > 1;
  const prev = () =>
    setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartXRef.current = t.clientX;
    touchStartYRef.current = t.clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current == null || touchStartYRef.current == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartXRef.current;
    const dy = t.clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (!hasMany) return;
    if (dx > 0) prev();
    else next();
  };

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
            className="relative flex-1 flex items-center justify-center px-4 pb-6 min-h-0 touch-pan-y"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
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

            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              className="relative max-h-full max-w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[index]?.url}
                alt={images[index]?.label}
                className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
              {images[index]?.bubbles &&
                images[index].bubbles.length > 0 && (
                  <BubblePreviewOverlay bubbles={images[index].bubbles} />
                )}
            </motion.div>

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
              className="overflow-x-auto pb-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* w-max + min-w-full + mx-auto centers when the strip fits and stays fully scrollable (incl. the first/front-cover thumb) when it overflows — justify-center alone clips the left overflow. */}
              <div className="flex w-max min-w-full items-center justify-center gap-1.5 px-4 mx-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    ref={i === index ? activeThumbRef : undefined}
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
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
