"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeedback } from "@/lib/hooks/use-feedback";
import { PageHeader } from "@/components/account/page-header";
import { FeedbackRow, type AdminFeedbackListItem } from "./feedback-row";

type StatusFilter = "all" | "open" | "in_progress" | "resolved";
type KindFilter = "all" | "bug" | "feedback" | "feature" | "question";

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

const KIND_OPTIONS: Array<{ value: KindFilter; label: string }> = [
  { value: "all", label: "All types" },
  { value: "bug", label: "Bugs" },
  { value: "feedback", label: "Feedback" },
  { value: "feature", label: "Features" },
  { value: "question", label: "Questions" },
];

export function FeedbackMain() {
  const { listAdmin: listFeedback } = useFeedback();
  const [items, setItems] = useState<AdminFeedbackListItem[] | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [kind, setKind] = useState<KindFilter>("all");
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(
    async (s: StatusFilter, k: KindFilter) => {
      setError(null);
      try {
        const res = await listFeedback({ status: s, kind: k, limit: 100 });
        setItems(res.items);
      } catch {
        setError(
          "Couldn't load feedback. The composite index (status ASC, createdAt DESC) on `feedback` may need to be built — check server logs for the auto-link.",
        );
      }
    },
    [listFeedback],
  );

  useEffect(() => {
    void fetchFeedback(status, kind);
  }, [status, kind, fetchFeedback]);

  return (
    <div>
      <PageHeader
        title="Feedback"
        description="Bug reports, feedback, feature requests, and questions from users."
      />

      <div className="flex flex-wrap items-center gap-2 mb-4 overflow-x-auto pb-1">
        <div
          role="tablist"
          aria-label="Status filter"
          className="inline-flex p-1 rounded-2xl border border-white/10 bg-zinc-900/60"
        >
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              role="tab"
              aria-selected={status === o.value}
              onClick={() => setStatus(o.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                status === o.value
                  ? "bg-amber-500/20 text-amber-100"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div
          role="tablist"
          aria-label="Kind filter"
          className="inline-flex p-1 rounded-2xl border border-white/10 bg-zinc-900/60"
        >
          {KIND_OPTIONS.map((o) => (
            <button
              key={o.value}
              role="tab"
              aria-selected={kind === o.value}
              onClick={() => setKind(o.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                kind === o.value
                  ? "bg-amber-500/20 text-amber-100"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

      {items === null && !error ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : items && items.length === 0 ? (
        <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-8 text-center">
          <MessageCircle className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">
            No feedback matches this filter yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items?.map((it) => <FeedbackRow key={it.id} item={it} />)}
        </div>
      )}
    </div>
  );
}
