"use client";

import { forwardRef } from "react";
import { UserBubble, AssistantBubble } from "../chat-bubble";
import { RefineEmptyState } from "./refine-empty-state";
import type { RefineContext, Turn } from "./types";

interface RefineTranscriptProps {
  turns: Turn[];
  context: RefineContext;
  error: string | null;
  onEditUserMessage: (text: string) => void;
  onBranch: (dataUrl: string) => void;
}

export const RefineTranscript = forwardRef<
  HTMLDivElement,
  RefineTranscriptProps
>(function RefineTranscript(
  { turns, context, error, onEditUserMessage, onBranch },
  ref,
) {
  return (
    <div ref={ref} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {turns.length === 0 && <RefineEmptyState context={context} />}
      {turns.map((t) =>
        t.kind === "user" ? (
          <UserBubble
            key={t.id}
            text={t.text}
            referenceDataUrl={t.referenceDataUrl}
            onEdit={onEditUserMessage}
          />
        ) : (
          <AssistantBubble
            key={t.id}
            reply={t.reply}
            awaitingReply={t.awaitingReply}
            generatingImage={t.generatingImage}
            imageDataUrl={t.imageDataUrl}
            referenceLabels={t.referenceLabels}
            onBranch={
              t.imageDataUrl ? () => onBranch(t.imageDataUrl!) : undefined
            }
          />
        ),
      )}
      {error && (
        <div className="text-[11px] text-red-300 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
});
