"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
}: BubbleEditorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 bg-zinc-900 border-white/10">
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
        <div className="px-5 pb-5 pt-2 flex flex-col items-center">
          <BubbleEditor
            bubbles={bubbles}
            onChange={onChange}
            imageSrc={imageSrc}
            aspectRatio="2/3"
            className="relative w-full max-w-[420px] bg-zinc-100 rounded-2xl overflow-hidden border border-white/10 shadow-xl"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
