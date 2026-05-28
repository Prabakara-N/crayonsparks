"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { BubbleStyleSnapshot } from "@/lib/bubble-style";
import { BubbleEditor } from "./bubble-editor-main";
import { BubbleToolbar } from "./bubble-toolbar";
import { useBubbleEditorActions } from "./use-bubble-editor-actions";
import type { StoryBubble } from "../types";

interface BubbleEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageName: string;
  pageIndex: number;
  totalPages: number;
  imageSrc: string;
  bubbles: StoryBubble[];
  onChange: (next: StoryBubble[]) => void;
  onApplyStyleToBook?: (style: BubbleStyleSnapshot) => void;
}

export function BubbleEditorModal({
  open,
  onOpenChange,
  pageName,
  pageIndex,
  totalPages,
  imageSrc,
  bubbles,
  onChange,
  onApplyStyleToBook,
}: BubbleEditorModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = bubbles.find((b) => b.id === selectedId) ?? null;
  const actions = useBubbleEditorActions({
    bubbles,
    onChange,
    selectedId,
    setSelectedId,
    onApplyStyleToBook,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl !w-[95vw] max-h-[92vh] overflow-y-auto p-0 bg-zinc-900 border-white/10 sm:!max-w-3xl">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-white">
            Edit bubbles — {pageName}
          </DialogTitle>
          <DialogDescription className="text-neutral-400 text-xs">
            Page {pageIndex + 1} of {totalPages}. Click a bubble to select it,
            then use the toolbar on the right.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5 pt-2 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 justify-center">
          <BubbleEditor
            bubbles={bubbles}
            onChange={onChange}
            imageSrc={imageSrc}
            aspectRatio="2/3"
            className="relative w-full max-w-[420px] bg-zinc-100 rounded-2xl overflow-hidden border border-white/10 shadow-xl"
            onApplyStyleToBook={onApplyStyleToBook}
            selectedId={selectedId}
            onSelectedChange={setSelectedId}
            hideFloatingToolbar
            showAddButton={false}
          />
          <aside className="w-full md:w-72 md:shrink-0 md:pt-2">
            {selected ? (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold px-1">
                  Editing bubble
                </p>
                <BubbleToolbar
                  inline
                  bubble={selected}
                  onDelete={actions.deleteBubble}
                  onChangeShape={actions.changeShape}
                  onChangeFont={actions.changeFont}
                  onChangeFill={actions.changeFill}
                  onChangeText={actions.changeText}
                  onChangeStroke={actions.changeStroke}
                  onChangeFontSize={actions.changeFontSize}
                  onApplyToAll={actions.applyStyleToAll}
                  applyToAllLabel={
                    onApplyStyleToBook ? "Apply to whole book" : "Apply to all"
                  }
                />
                <button
                  type="button"
                  onClick={actions.addBubble}
                  className="w-full mt-2 px-3 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold"
                >
                  + Add another bubble
                </button>
              </div>
            ) : (
              <div className="text-xs text-neutral-400 space-y-3 p-3 rounded-lg border border-dashed border-white/10">
                <p className="font-semibold text-white">No bubble selected</p>
                <p>Click a bubble on the left to edit its shape, font, size, and colors.</p>
                <button
                  type="button"
                  onClick={actions.addBubble}
                  className="w-full mt-2 px-3 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold"
                >
                  + Add a bubble
                </button>
              </div>
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
