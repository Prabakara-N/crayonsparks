"use client";

import { useState } from "react";
import type { BookBrief } from "@/lib/book-chat";
import { BriefQualityCard } from "@/components/generate/brief-quality-card";
import { PlanReviewButton } from "@/components/playground/plan-review-panel/plan-review-panel";

interface BriefPreviewProps {
  brief: BookBrief;
  onConfirm: () => void;
  onTweak: (feedback: string) => void;
  onUpdate: (next: BookBrief) => void;
}

export function BriefPreview({
  brief,
  onConfirm,
  onTweak,
  onUpdate,
}: BriefPreviewProps) {
  const [tweakOpen, setTweakOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  return (
    <div className="mt-2 rounded-2xl border border-violet-500/40 bg-linear-to-br from-violet-500/10 to-cyan-500/5 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="text-3xl shrink-0">{brief.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-violet-300">
            Plan ready · {brief.prompts.length} pages
          </div>
          <div className="text-base font-bold text-white truncate mt-0.5">
            {brief.name}
          </div>
        </div>
      </div>

      {tweakOpen ? (
        <div className="space-y-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="What should I change? e.g. 'make it shorter, 10 pages instead of 20' or 'use a different protagonist name'"
            className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500/60 resize-y"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => setTweakOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (feedback.trim()) onTweak(feedback.trim());
              }}
              disabled={!feedback.trim()}
              className="ml-auto px-4 py-1.5 rounded-lg text-xs font-semibold bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50"
            >
              Send revision
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <BriefQualityCard quality={brief.quality} />
          <PlanReviewButton
            data={{
              title: brief.name,
              coverTitle: brief.name,
              coverScene: brief.coverScene,
              scene: brief.pageScene,
              characters: brief.characters?.map((c) => ({
                name: c.name,
                descriptor: c.descriptor,
              })),
              prompts: brief.prompts.map((p) => ({
                name: p.name,
                subject: p.subject,
                dialogue: p.dialogue,
                narration: p.narration,
              })),
            }}
            modeNotice={
              brief.characters?.length || brief.palette
                ? "Story-book pages render with locked characters + palette + the dialogue / narration shown per page below."
                : undefined
            }
            onSave={(next) => {
              onUpdate({
                ...brief,
                name: next.coverTitle?.trim() || next.title?.trim() || brief.name,
                coverScene: next.coverScene ?? brief.coverScene,
                pageScene: next.scene ?? brief.pageScene,
                prompts: next.prompts.map((p, i) => ({
                  ...brief.prompts[i],
                  name: p.name,
                  subject: p.subject,
                })),
              });
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-linear-to-r from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/30 hover:shadow-xl"
            >
              ✓ Looks good — save it
            </button>
            <button
              onClick={() => setTweakOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-violet-100 bg-white/5 border border-white/15 hover:bg-white/10"
            >
              ✏️ Tweak this
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
