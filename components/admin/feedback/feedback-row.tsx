"use client";

import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";
import { FEEDBACK_KIND_LABELS, type FeedbackKind } from "@/lib/feedback/types";

export interface AdminFeedbackListItem {
  id: string;
  userId: string;
  userEmail: string | null;
  kind: string;
  title: string;
  body: string;
  page: string | null;
  status: string;
  hasScreenshot: boolean;
  createdAt: number | null;
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  in_progress: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  resolved: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
};

const KIND_STYLES: Record<string, string> = {
  bug: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  feedback: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  feature: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  question: "bg-amber-500/15 text-amber-200 border-amber-500/30",
};

function relTime(ms: number | null): string {
  if (!ms) return "";
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

interface FeedbackRowProps {
  item: AdminFeedbackListItem;
}

export function FeedbackRow({ item }: FeedbackRowProps) {
  return (
    <Link
      href={`/admin/feedback/${item.id}`}
      className="block rounded-xl bg-zinc-900/60 border border-white/10 hover:border-white/20 hover:bg-zinc-900/80 px-4 py-3 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${KIND_STYLES[item.kind] ?? ""}`}
          >
            {FEEDBACK_KIND_LABELS[item.kind as FeedbackKind] ?? item.kind}
          </span>
          <span
            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${STATUS_STYLES[item.status] ?? ""}`}
          >
            {item.status.replace(/_/g, " ")}
          </span>
          {item.hasScreenshot && (
            <span
              aria-label="Has screenshot"
              className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground"
            >
              <ImageIcon className="h-3 w-3" />
            </span>
          )}
        </div>
        <span className="text-[11px] text-neutral-500 shrink-0">
          {relTime(item.createdAt)}
        </span>
      </div>
      <p className="text-sm font-medium text-white truncate">
        {item.title}
      </p>
      <p className="mt-0.5 text-xs text-neutral-400 line-clamp-2">
        {item.body}
      </p>
      <p className="mt-1 text-[11px] text-neutral-500 truncate">
        {item.userEmail ?? item.userId.slice(0, 8)} · {item.page ?? "—"}
      </p>
    </Link>
  );
}
