"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFeedback } from "@/lib/hooks/use-feedback";
import type { FeedbackKind } from "@/lib/feedback/types";

interface FeedbackSurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookKind: "coloring" | "story";
  bookTitle?: string;
}

const KIND_OPTIONS: Array<{ value: FeedbackKind; label: string; hint: string }> = [
  { value: "feedback", label: "General feedback", hint: "How was it overall?" },
  { value: "feature", label: "Feature idea", hint: "What would make it better?" },
  { value: "bug", label: "Something broke", hint: "Tell us what went wrong." },
  { value: "question", label: "Question", hint: "We'll reply by email." },
];

export function FeedbackSurveyModal({
  open,
  onOpenChange,
  bookKind,
  bookTitle,
}: FeedbackSurveyModalProps) {
  const feedback = useFeedback();
  const [kind, setKind] = useState<FeedbackKind>("feedback");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const reset = () => {
    setTitle("");
    setBody("");
    setKind("feedback");
  };

  const handleSubmit = async () => {
    const trimmedBody = body.trim();
    const finalTitle =
      title.trim() ||
      `First ${bookKind} book feedback${bookTitle ? ` — ${bookTitle}` : ""}`;
    if (trimmedBody.length < 5) {
      toast.error("Add a bit more detail in the message field.");
      return;
    }
    setSubmitting(true);
    try {
      await feedback.submit({
        kind,
        title: finalTitle,
        body: trimmedBody,
        page:
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : undefined,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        source: "post-book-survey",
        bookKind,
      });
      toast.success("Thank you — we read every message.");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      await feedback.skipSurvey(bookKind);
    } finally {
      setSkipping(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-md !w-[95vw] bg-zinc-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            How was your first {bookKind} book?
          </DialogTitle>
          <DialogDescription className="text-neutral-400 text-xs">
            A short note from you helps us make the next one better. Skip if
            you&apos;d rather not.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">
              Kind
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {KIND_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKind(opt.value)}
                  className={`text-left rounded-lg border px-2.5 py-1.5 transition-colors ${
                    kind === opt.value
                      ? "border-violet-400 bg-violet-500/10 text-white"
                      : "border-white/10 bg-white/5 text-neutral-300 hover:border-white/20"
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] text-neutral-500">{opt.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">
              Title <span className="text-neutral-600">(optional)</span>
            </p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="One-line summary"
              maxLength={140}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/60"
            />
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">
              Your message
            </p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What worked, what didn't, ideas for next time…"
              rows={4}
              maxLength={4000}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/60 resize-y min-h-[96px]"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2 sm:justify-between">
          <button
            type="button"
            onClick={handleSkip}
            disabled={submitting || skipping}
            className="px-3 py-2 rounded-lg text-xs text-neutral-400 hover:bg-white/5 disabled:opacity-50"
          >
            {skipping ? "Skipping…" : "Maybe later"}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || skipping || body.trim().length < 5}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Send feedback
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
