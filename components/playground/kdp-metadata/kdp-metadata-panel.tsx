"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import {
  draftToKdpMetadata,
  type ListingDraft,
  type ListingPlatform,
  type PlatformStatus,
} from "@/lib/kdp-metadata";
import { TAB_CONFIG } from "./kdp-metadata-tab-config";
import { TabBar } from "./tab-bar";
import { TabContent } from "./tab-content";
import { DownloadPackageButton } from "./download-package-button";
import { CopyAllButton } from "./copy-all-button";

interface KdpMetadataPanelProps {
  bookName: string;
  pageCount: number;
  draft: ListingDraft;
  status: Record<ListingPlatform, PlatformStatus>;
  errors: Partial<Record<ListingPlatform, string>>;
  onGenerate: (platform?: ListingPlatform) => void;
}

export function KdpMetadataPanel({
  bookName,
  pageCount,
  draft,
  status,
  errors,
  onGenerate,
}: KdpMetadataPanelProps) {
  const anyLoading = useMemo(
    () => TAB_CONFIG.some((t) => status[t.id] === "loading"),
    [status],
  );
  const anyDone = useMemo(
    () => TAB_CONFIG.some((t) => status[t.id] === "done"),
    [status],
  );
  const allPending = useMemo(
    () => TAB_CONFIG.every((t) => status[t.id] === "pending"),
    [status],
  );

  const [activeTab, setActiveTab] = useState<ListingPlatform>("kdp");
  useEffect(() => {
    if (status[activeTab] !== "pending") return;
    const firstDone = TAB_CONFIG.find((t) => status[t.id] === "done");
    if (firstDone) setActiveTab(firstDone.id);
  }, [status, activeTab]);

  const fullMetadata = useMemo(() => draftToKdpMetadata(draft), [draft]);

  return (
    <div className="rounded-3xl p-5 md:p-6 bg-zinc-900/60 backdrop-blur-xl border border-white/10 space-y-4">
      <div className="flex items-center gap-2.5 flex-wrap">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <h3 className="font-semibold text-sm">Listing Metadata & SEO</h3>
        <span className="text-[11px] text-neutral-500">
          KDP · Etsy · Gumroad · Pinterest · Instagram · X
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onGenerate()}
            disabled={anyLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow disabled:opacity-60"
          >
            {anyLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : anyDone ? (
              <RefreshCw className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {anyDone ? "Regenerate all" : "Generate all"}
          </button>
        </div>
      </div>

      {allPending && (
        <p className="text-xs text-neutral-500 leading-relaxed">
          Click <strong>Generate all</strong> for a one-shot launch kit:{" "}
          <strong>Amazon KDP</strong>, <strong>Etsy</strong> (140-char title +
          13 tags), <strong>Gumroad</strong> (name, emoji description, 5–7 info
          rows, tags + category), <strong>Pinterest</strong>,{" "}
          <strong>Instagram</strong>, and <strong>X / Twitter</strong>. Each
          tab fills in as soon as it's ready.
        </p>
      )}

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} status={status} />

      <TabContent
        tab={activeTab}
        draft={draft}
        status={status[activeTab]}
        error={errors[activeTab]}
        pageCount={pageCount}
        bookName={bookName}
        onRetry={() => onGenerate(activeTab)}
      />

      {fullMetadata && (
        <div className="pt-3 border-t border-white/10 flex gap-2 flex-wrap">
          <DownloadPackageButton
            bookName={bookName}
            pageCount={pageCount}
            metadata={fullMetadata}
          />
          <CopyAllButton metadata={fullMetadata} />
        </div>
      )}
    </div>
  );
}
