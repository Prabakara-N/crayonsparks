"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { BubbleStyleSnapshot } from "@/lib/bubble-style";
import { BubbleEditor } from "./bubble-editor-main";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto p-0 bg-zinc-900 border-white/10">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-white">
            Edit bubbles — {pageName}
          </DialogTitle>
          <DialogDescription className="text-neutral-400 text-xs">
            Page {pageIndex + 1} of {totalPages}. Click a bubble to select.
            Drag the body to move, violet handle to resize, cyan dot to move
            the tail tip. Click text to edit. Changes save automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5 pt-2 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 justify-center">
          <BubbleEditor
            bubbles={bubbles}
            onChange={onChange}
            imageSrc={imageSrc}
            aspectRatio="2/3"
            className="relative w-full max-w-[460px] bg-zinc-100 rounded-2xl overflow-hidden border border-white/10 shadow-xl"
            onApplyStyleToBook={onApplyStyleToBook}
          />
          <aside className="hidden md:block w-60 shrink-0 text-xs text-neutral-300 space-y-3 pt-2">
            <div>
              <p className="font-semibold text-white mb-1">Quick guide</p>
              <ul className="space-y-1.5 leading-relaxed text-neutral-400">
                <li>• Click a bubble to select it</li>
                <li>• Drag the body to move</li>
                <li>• Violet handle = resize</li>
                <li>• Cyan dot = tail tip</li>
                <li>• Click text to edit</li>
              </ul>
            </div>
            <div className="border-t border-white/10 pt-3">
              <p className="font-semibold text-white mb-1">Toolbar</p>
              <p className="text-neutral-400 leading-relaxed">
                Appears above the selected bubble. Pick shape, font, size,
                colors, or apply the style to every bubble in the whole
                book.
              </p>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
