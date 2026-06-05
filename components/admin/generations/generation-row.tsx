/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { generationKindMeta } from "./generation-kind-meta";

export interface AdminGeneration {
  bookId: string;
  ownerUid: string | null;
  ownerEmail: string | null;
  title: string;
  kind: "coloring" | "story" | "activity";
  pageCount: number;
  coverThumbUrl: string | null;
  createdAt: number | null;
}

export function relTime(ms: number | null): string {
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

interface GenerationRowProps {
  item: AdminGeneration;
}

export function GenerationRow({ item }: GenerationRowProps) {
  const meta = generationKindMeta(item.kind);
  const Icon = meta.icon;
  return (
    <div className="rounded-xl bg-zinc-900/60 border border-white/10 px-3 py-3 flex items-center gap-3">
      <div className="w-12 h-16 rounded-md overflow-hidden bg-black/40 shrink-0 border border-white/5">
        {item.coverThumbUrl ? (
          <img
            src={item.coverThumbUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-[10px]">
            no img
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${meta.soft}`}
          >
            <Icon className="w-3 h-3" />
            {meta.label}
          </span>
          <span className="text-[11px] text-neutral-500">
            {item.pageCount} pages · {relTime(item.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-white truncate">
          {item.title || "(untitled)"}
        </p>
        {item.ownerUid ? (
          <Link
            href={`/admin/users/${item.ownerUid}`}
            className="text-[11px] text-neutral-400 hover:text-amber-300 truncate inline-block max-w-full"
          >
            {item.ownerEmail ?? item.ownerUid}
          </Link>
        ) : (
          <p className="text-[11px] text-neutral-500">unknown user</p>
        )}
      </div>
    </div>
  );
}
