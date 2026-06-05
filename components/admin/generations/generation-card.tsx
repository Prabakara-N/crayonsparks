/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { relTime, type AdminGeneration } from "./generation-row";
import { generationKindMeta } from "./generation-kind-meta";

export function GenerationCard({ item }: { item: AdminGeneration }) {
  const meta = generationKindMeta(item.kind);
  const Icon = meta.icon;
  return (
    <div className="group rounded-xl bg-zinc-900/60 border border-white/10 overflow-hidden hover:border-amber-500/40 transition-colors">
      <div className="aspect-[3/4] bg-black/40 relative">
        {item.coverThumbUrl ? (
          <img
            src={item.coverThumbUrl}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
            no cover
          </div>
        )}
        <span
          className={`absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${meta.solid}`}
        >
          <Icon className="w-3 h-3" />
          {meta.label}
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-white truncate">
          {item.title || "(untitled)"}
        </p>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          {item.pageCount} pages · {relTime(item.createdAt)}
        </p>
        {item.ownerUid ? (
          <Link
            href={`/admin/users/${item.ownerUid}`}
            className="mt-1 text-[11px] text-neutral-400 hover:text-amber-300 truncate inline-block max-w-full"
          >
            {item.ownerEmail ?? item.ownerUid}
          </Link>
        ) : (
          <p className="mt-1 text-[11px] text-neutral-500">unknown user</p>
        )}
      </div>
    </div>
  );
}
