"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  MessageSquare,
  Pencil,
  RefreshCw,
  Trash2,
  Wand2,
} from "lucide-react";
import { Pending } from "./pending";
import { ErrorState } from "./error-state";
import type { CarouselProps } from "./carousel";
import type { Aspect, PromptItem } from "./types";

export function PageDetail({
  item,
  pageIndex,
  aspectRatio,
  onEditPrompt,
  onRemove,
  onRegenerate,
  onOpenRefine,
  onSetItem,
}: {
  item: PromptItem;
  pageIndex: number;
  aspectRatio: Aspect;
  onEditPrompt: CarouselProps["onEditPrompt"];
  onRemove: CarouselProps["onRemove"];
  onRegenerate: CarouselProps["onRegenerateItem"];
  onOpenRefine: CarouselProps["onOpenRefine"];
  onSetItem: CarouselProps["onSetItem"];
}) {
  // Auto-open the prompt editor when a page errors so the user sees the
  // editable subject + a Regenerate button as one flow — no need to hunt
  // for the pencil icon. Refine isn't useful here (no image to refine);
  // the only fix is to tweak the prompt and try again.
  const [editing, setEditing] = useState(item.status === "error");
  useEffect(() => {
    if (item.status === "error") setEditing(true);
  }, [item.status]);

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6">
      <div
        className="relative rounded-2xl overflow-hidden bg-linear-to-br from-zinc-800 to-zinc-900 border border-white/10"
        style={{ aspectRatio: aspectRatio.replace(":", "/") }}
      >
        {item.status === "done" && item.dataUrl ? (
          <button
            type="button"
            onClick={() =>
              onOpenRefine("page", {
                targetId: item.id,
                dataUrl: item.dataUrl!,
                title: item.name,
                subtitle: `Page ${pageIndex} · ${item.id}`,
                downloadName: `${item.id}_${item.name.replace(/[^a-z0-9]+/gi, "_")}.png`,
                onRefined: (d) => onSetItem(item.id, d),
                quality: item.quality,
              })
            }
            className="absolute inset-0 w-full h-full group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.dataUrl}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-contain bg-white"
            />
            {/* Border is drawn into the image by Gemini (per master prompt
                DRAW_BORDER_RULE) — no CSS overlay needed. */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-semibold">Click to refine</span>
            </div>
          </button>
        ) : item.status === "done" && !item.dataUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-amber-950/20 text-amber-200 p-6 text-center">
            <RefreshCw className="w-9 h-9" />
            <div>
              <p className="text-sm font-semibold">Image cleared from cache</p>
              <p className="text-xs opacity-80 mt-1 max-w-xs">
                The image bytes were dropped on browser refresh
                (sessionStorage size limit). Click <strong>Regenerate page</strong>{" "}
                below to recreate it from the same prompt.
              </p>
            </div>
          </div>
        ) : item.status === "generating" ? (
          <Pending label={`Generating ${item.name}…`} />
        ) : item.status === "error" ? (
          <ErrorState message={item.error ?? "Failed"} />
        ) : (
          <Pending label={item.name} icon={<Wand2 className="w-7 h-7" />} />
        )}
      </div>

      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-wider text-neutral-500 flex-1">
            #{item.id}
          </p>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            title="Edit prompt"
            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            title="Remove page from book"
            className="p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {editing ? (
          <div className="space-y-2">
            {item.status === "error" && (
              <p className="text-[11px] text-amber-300 leading-relaxed bg-amber-500/10 border border-amber-500/30 rounded-md px-2.5 py-1.5">
                ✏️ Tweak the subject below to avoid the Gemini refusal, then click <strong>Regenerate</strong>.
              </p>
            )}
            <input
              type="text"
              value={item.name}
              onChange={(e) => onEditPrompt(item.id, { name: e.target.value })}
              placeholder="Name"
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/60"
            />
            <textarea
              value={item.subject}
              onChange={(e) => onEditPrompt(item.id, { subject: e.target.value })}
              rows={4}
              placeholder="Subject (what to draw)"
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500/60 resize-y"
            />
            {item.status !== "error" && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-xs text-violet-300 font-semibold"
              >
                Done
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            {item.subject}
          </p>
        )}

        <button
          type="button"
          onClick={() => void onRegenerate(item)}
          disabled={item.status === "generating" || item.status === "queued"}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white hover:shadow-lg disabled:opacity-60 transition-all"
        >
          {item.status === "generating" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : item.status === "done" ? (
            <RefreshCw className="w-4 h-4" />
          ) : item.status === "error" ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          {item.status === "done"
            ? "Regenerate page"
            : item.status === "error"
              ? "Regenerate with new prompt"
              : "Generate page"}
        </button>
      </div>
    </div>
  );
}
