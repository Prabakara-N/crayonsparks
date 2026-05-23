/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useFeedback } from "@/lib/hooks/use-feedback";
import {
  FEEDBACK_KIND_LABELS,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_STATUSES,
  type FeedbackKind,
  type FeedbackStatus,
} from "@/lib/feedback/types";
import { LoadingState } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FeedbackDoc {
  id: string;
  userId: string;
  userEmail: string | null;
  kind: string;
  title: string;
  body: string;
  page: string | null;
  userAgent: string | null;
  status: string;
  adminNotes: string;
  screenshotUrl: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  respondedAt: number | null;
}

interface FeedbackDetailMainProps {
  id: string;
}

const KIND_STYLES: Record<string, string> = {
  bug: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  feedback: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  feature: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  question: "bg-amber-500/15 text-amber-200 border-amber-500/30",
};

function formatDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString();
}

export function FeedbackDetailMain({ id }: FeedbackDetailMainProps) {
  const { getAdmin: getFeedback, updateAdmin: updateFeedback } = useFeedback();
  const [doc, setDoc] = useState<FeedbackDoc | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoc = useCallback(async () => {
    try {
      const res = await getFeedback(id);
      setDoc(res);
      setNotes(res.adminNotes ?? "");
    } catch {
      setError("Couldn't load feedback.");
    }
  }, [getFeedback, id]);

  useEffect(() => {
    void fetchDoc();
  }, [fetchDoc]);

  async function setStatus(next: FeedbackStatus) {
    if (!doc || savingStatus) return;
    setSavingStatus(true);
    try {
      await updateFeedback({ id, status: next });
      setDoc({ ...doc, status: next });
      toast.success("Status updated.");
    } catch {
      toast.error("Couldn't update status.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function saveNotes() {
    if (!doc || savingNotes) return;
    setSavingNotes(true);
    try {
      await updateFeedback({ id, adminNotes: notes });
      toast.success("Notes saved.");
    } catch {
      toast.error("Couldn't save notes.");
    } finally {
      setSavingNotes(false);
    }
  }

  if (error) {
    return (
      <div>
        <Link
          href="/admin/feedback"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-3 h-3" /> Back to feedback
        </Link>
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (!doc) {
    return <LoadingState label="Loading feedback…" />;
  }

  return (
    <div>
      <Link
        href="/admin/feedback"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> Back to feedback
      </Link>

      <div className="flex items-center gap-2 mb-2">
        <span
          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${KIND_STYLES[doc.kind] ?? ""}`}
        >
          {FEEDBACK_KIND_LABELS[doc.kind as FeedbackKind] ?? doc.kind}
        </span>
        <span className="text-[11px] text-neutral-500">
          {formatDate(doc.createdAt)}
        </span>
      </div>
      <h1 className="font-display text-2xl font-semibold text-white mb-1">
        {doc.title}
      </h1>
      <p className="text-xs text-neutral-500 mb-6">
        {doc.userEmail ?? doc.userId} · sent from{" "}
        <span className="font-mono">{doc.page ?? "—"}</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
        <div className="space-y-4">
          <section className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
              Description
            </h3>
            <p className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">
              {doc.body}
            </p>
          </section>

          {doc.screenshotUrl && (
            <section className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                Screenshot
              </h3>
              <a
                href={doc.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg overflow-hidden border border-white/10 bg-black/40"
              >
                <img
                  src={doc.screenshotUrl}
                  alt="Screenshot"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </a>
            </section>
          )}

          <section className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Admin notes (internal)
              </h3>
              <Button
                type="button"
                size="sm"
                onClick={saveNotes}
                disabled={savingNotes || notes === doc.adminNotes}
                className="gap-1.5"
              >
                {savingNotes && <Loader2 className="h-3 w-3 animate-spin" />}
                Save
              </Button>
            </div>
            <Label htmlFor="admin-notes" className="sr-only">
              Admin notes
            </Label>
            <Textarea
              id="admin-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Triage notes, next steps, root cause…"
              maxLength={4000}
            />
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
              Status
            </h3>
            <div className="space-y-1.5">
              {FEEDBACK_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  disabled={savingStatus}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-left border transition-colors disabled:opacity-50 ${
                    doc.status === s
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                  }`}
                >
                  {FEEDBACK_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
              Metadata
            </h3>
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-neutral-500">User</dt>
                <dd className="text-neutral-200 break-all">
                  <Link
                    href={`/admin/users/${doc.userId}`}
                    className="hover:text-amber-300"
                  >
                    {doc.userEmail ?? doc.userId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Created</dt>
                <dd className="text-neutral-200">
                  {formatDate(doc.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Updated</dt>
                <dd className="text-neutral-200">
                  {formatDate(doc.updatedAt)}
                </dd>
              </div>
              {doc.respondedAt && (
                <div>
                  <dt className="text-neutral-500">Resolved</dt>
                  <dd className="text-neutral-200">
                    {formatDate(doc.respondedAt)}
                  </dd>
                </div>
              )}
              {doc.userAgent && (
                <div>
                  <dt className="text-neutral-500">User-Agent</dt>
                  <dd className="text-neutral-200 break-all font-mono text-[10px]">
                    {doc.userAgent}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
