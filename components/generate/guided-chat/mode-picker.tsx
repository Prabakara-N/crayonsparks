"use client";

import { MessageCircle, BookOpen, Sparkles } from "lucide-react";
import type { Mode } from "./types";

interface ModePickerProps {
  onPick: (mode: Mode) => void;
}

export function ModePicker({ onPick }: ModePickerProps) {
  return (
    <div className="p-6 md:p-8 space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-linear-to-r from-violet-500/15 to-cyan-500/15 border border-violet-500/30 text-[11px] font-medium text-violet-300 mb-2">
          <Sparkles className="w-3 h-3" />
          Sparky AI · pick a mode
        </div>
        <h3 className="font-display text-xl md:text-2xl font-bold text-white">
          How would you like to create your book?
        </h3>
        <p className="text-sm text-neutral-400 mt-1">
          I&apos;ll ask a few questions and generate a complete plan you can
          review before saving. Pick the mode that fits what you&apos;re
          making — they produce <em>different</em> kinds of books.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <button
          onClick={() => onPick("qa")}
          className="group text-left p-5 rounded-2xl border border-white/10 bg-black/40 hover:border-violet-500/50 hover:bg-violet-500/5 transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-violet-300" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30">
              No story · single subjects
            </span>
          </div>
          <div className="font-semibold text-white text-base mb-1">
            Coloring book — Theme
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed mb-3">
            <strong className="text-neutral-200">When to use:</strong> you have
            a <em>theme</em> in mind (jungle animals, unicorns, dinosaurs,
            vehicles) but NO story. Sparky asks 3-5 questions about audience,
            style, and which characters → builds a <strong className="text-neutral-200">black-and-white
            coloring book</strong> where each page shows ONE subject from
            that theme.
          </p>
          <ul className="text-[12px] text-neutral-500 space-y-1 leading-relaxed">
            <li>🎨 Pure B&amp;W line art — kids color it in</li>
            <li>📋 Each page = one stand-alone subject</li>
            <li>🎯 No narrative — pages are independent</li>
            <li>💼 Best for browsing-friendly KDP books that sell on theme</li>
          </ul>
        </button>

        <button
          onClick={() => onPick("story")}
          className="group text-left p-5 rounded-2xl border border-white/10 bg-black/40 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-cyan-300" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
              Has plot · scenes in order
            </span>
          </div>
          <div className="font-semibold text-white text-base mb-1">
            Story book — Narrative
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed mb-3">
            <strong className="text-neutral-200">When to use:</strong> you have
            a <em>story</em> — classic fable (Tortoise &amp; Hare, Union is
            Strength, Lion &amp; Mouse) or your own original. Sparky knows
            hundreds of fables by name. Each page becomes a SCENE in
            narrative order, rendered as a{" "}
            <strong className="text-neutral-200">full-color story book</strong>{" "}
            with locked characters and speech bubbles.
          </p>
          <ul className="text-[12px] text-neutral-500 space-y-1 leading-relaxed">
            <li>🎨 Full color — vibrant illustration, not line art</li>
            <li>🎬 Each page = a scene from the story</li>
            <li>👥 Characters &amp; palette stay consistent across pages</li>
            <li>💬 Speech bubbles render the dialogue inline</li>
            <li>🌟 Best for fables, folktales, original kids&apos; stories</li>
          </ul>
        </button>
      </div>
    </div>
  );
}
