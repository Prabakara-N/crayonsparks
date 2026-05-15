"use client";

import { motion } from "motion/react";
import {
  Loader2,
  X,
  Download,
  MessageSquare,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Status, Version } from "./types";
import { QUICK_REFINEMENTS } from "./playground-studio-constants";

interface VersionRefineModalProps {
  current: Version;
  versions: Version[];
  currentIndex: number;
  status: Status;
  error: string | null;
  instruction: string;
  onInstructionChange: (value: string) => void;
  onClose: () => void;
  onRefine: () => void;
  onNav: (delta: number) => void;
}

export function VersionRefineModal({
  current,
  versions,
  currentIndex,
  status,
  error,
  instruction,
  onInstructionChange,
  onClose,
  onRefine,
  onNav,
}: VersionRefineModalProps) {
  return (
    <motion.div
      key="modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-9999 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-10000 p-2.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-colors shadow-lg"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[92vh] rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl shadow-violet-500/20 overflow-hidden grid md:grid-cols-[1fr_400px]"
      >
        {/* Image pane */}
        <div className="relative bg-black flex items-center justify-center min-h-[320px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.dataUrl}
            alt="Current version"
            className="w-full h-full max-h-[92vh] object-contain bg-white"
          />
          {status === "refining" && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-violet-300" />
              <p className="text-sm text-violet-200 font-medium">
                Applying refinement…
              </p>
            </div>
          )}
          {versions.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur border border-white/10 text-white text-xs">
              <button
                onClick={() => onNav(-1)}
                disabled={currentIndex === 0}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
                aria-label="Previous version"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono">
                {currentIndex + 1} / {versions.length}
              </span>
              <button
                onClick={() => onNav(1)}
                disabled={currentIndex === versions.length - 1}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
                aria-label="Next version"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Refinement pane */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[90vh]">
          <div>
            <h3 className="font-display text-lg font-semibold text-white mb-1">
              Refine with feedback
            </h3>
            <p className="text-xs text-neutral-400">
              Tell Gemini what to change. Each refinement builds on the current
              version.
            </p>
          </div>

          {current.instruction && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">
              <p className="font-semibold mb-1 uppercase tracking-wider text-[10px] text-emerald-300">
                Last change
              </p>
              <p className="leading-relaxed">{current.instruction}</p>
            </div>
          )}

          <textarea
            value={instruction}
            onChange={(e) => onInstructionChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onRefine();
            }}
            placeholder="e.g. Remove the sun from the top, add a decorative border around the page, and add more grass at the bottom"
            rows={4}
            disabled={status === "refining"}
            className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 resize-y min-h-[100px]"
          />

          <button
            onClick={onRefine}
            disabled={!instruction.trim() || status === "refining"}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-violet-500 via-indigo-400 to-cyan-400 shadow-lg shadow-violet-500/30 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {status === "refining" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Apply refinement
          </button>

          <div>
            <p className="text-xs font-semibold text-neutral-400 mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" />
              Quick suggestions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REFINEMENTS.map((r) => (
                <button
                  key={r}
                  onClick={() => onInstructionChange(r)}
                  disabled={status === "refining"}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-white disabled:opacity-50 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-white/10 flex flex-wrap gap-2">
            <a
              href={current.dataUrl}
              download={`playground_v${currentIndex + 1}.png`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-neutral-200"
            >
              <Download className="w-3.5 h-3.5" />
              Download PNG
            </a>
          </div>

          {status === "error" && error && (
            <div className="flex items-start gap-2 text-xs text-red-300">
              <X className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
