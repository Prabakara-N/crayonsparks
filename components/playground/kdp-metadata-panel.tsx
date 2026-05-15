"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  FileDown,
  Tag,
  ListTree,
  DollarSign,
  ShoppingBag,
  ShoppingCart,
  Hash,
  Pin,
  Bird,
  BookOpen,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  draftToKdpMetadata,
  type EtsyMetadata,
  type GumroadMetadata,
  type InstagramPost,
  type KdpCore,
  type KdpMetadata,
  type ListingDraft,
  type ListingPlatform,
  type PinterestPin,
  type PlatformStatus,
  type TwitterPost,
} from "@/lib/kdp-metadata";
import { buildKdpPackagePdf } from "@/lib/kdp-package-pdf";
import { DescriptionWithToggle } from "./description-with-toggle";

const TAB_CONFIG: ReadonlyArray<{
  id: ListingPlatform;
  label: string;
  icon: typeof BookOpen;
  accent: string;
}> = [
  { id: "kdp", label: "Amazon KDP", icon: BookOpen, accent: "text-violet-300" },
  { id: "etsy", label: "Etsy", icon: ShoppingBag, accent: "text-orange-300" },
  {
    id: "gumroad",
    label: "Gumroad",
    icon: ShoppingCart,
    accent: "text-pink-300",
  },
  { id: "pinterest", label: "Pinterest", icon: Pin, accent: "text-rose-300" },
  {
    id: "instagram",
    label: "Instagram",
    icon: Hash,
    accent: "text-fuchsia-300",
  },
  { id: "twitter", label: "X / Twitter", icon: Bird, accent: "text-sky-300" },
];

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

      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
      />

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

function TabBar({
  activeTab,
  setActiveTab,
  status,
}: {
  activeTab: ListingPlatform;
  setActiveTab: (tab: ListingPlatform) => void;
  status: Record<ListingPlatform, PlatformStatus>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-2">
      {TAB_CONFIG.map((tab) => {
        const Icon = tab.icon;
        const s = status[tab.id];
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${active ? tab.accent : ""}`} />
            <span>{tab.label}</span>
            <StatusDot status={s} />
          </button>
        );
      })}
    </div>
  );
}

function StatusDot({ status }: { status: PlatformStatus }) {
  if (status === "loading")
    return <Loader2 className="w-3 h-3 animate-spin text-violet-300" />;
  if (status === "done")
    return <Check className="w-3 h-3 text-emerald-400" />;
  if (status === "error")
    return <AlertTriangle className="w-3 h-3 text-red-400" />;
  return <Clock className="w-3 h-3 text-neutral-600" />;
}

function TabContent({
  tab,
  draft,
  status,
  error,
  pageCount,
  bookName,
  onRetry,
}: {
  tab: ListingPlatform;
  draft: ListingDraft;
  status: PlatformStatus;
  error?: string;
  pageCount: number;
  bookName: string;
  onRetry: () => void;
}) {
  if (status === "loading") {
    return <LoadingState platform={tab} />;
  }
  if (status === "error") {
    return <ErrorState error={error} onRetry={onRetry} />;
  }
  if (status === "pending") {
    return <PendingState />;
  }

  switch (tab) {
    case "kdp":
      return draft.kdp ? (
        <KdpView kdp={draft.kdp} pageCount={pageCount} bookName={bookName} />
      ) : null;
    case "etsy":
      return draft.etsy ? <EtsyView etsy={draft.etsy} /> : null;
    case "gumroad":
      return draft.gumroad ? <GumroadView gumroad={draft.gumroad} /> : null;
    case "pinterest":
      return draft.pinterest ? <PinterestView pin={draft.pinterest} /> : null;
    case "instagram":
      return draft.instagram ? (
        <InstagramView post={draft.instagram} />
      ) : null;
    case "twitter":
      return draft.twitter ? <TwitterView post={draft.twitter} /> : null;
  }
}

function LoadingState({ platform }: { platform: ListingPlatform }) {
  const label = TAB_CONFIG.find((t) => t.id === platform)?.label ?? platform;
  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-5 flex items-center gap-3">
      <Loader2 className="w-4 h-4 animate-spin text-violet-300" />
      <div className="text-xs text-violet-100">
        Generating <strong>{label}</strong> listing… this usually takes 3–15
        seconds.
      </div>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error?: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-red-200">
          {error ?? "Generation failed for this platform."}
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-100"
        >
          <RefreshCw className="w-3 h-3" /> Retry this tab
        </button>
      </div>
    </div>
  );
}

function PendingState() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-5 text-xs text-neutral-500 text-center">
      Click <strong>Generate all</strong> above to fill this tab.
    </div>
  );
}

function KdpView({
  kdp,
  pageCount,
  bookName,
}: {
  kdp: KdpCore;
  pageCount: number;
  bookName: string;
}) {
  return (
    <div className="space-y-3">
      <MetadataField label="SEO Title (≤200 chars)" value={kdp.title} mono />
      {kdp.subtitle && <MetadataField label="Subtitle" value={kdp.subtitle} />}
      <DescriptionWithToggle
        title={kdp.title || bookName}
        plain={kdp.descriptionText}
        html={kdp.descriptionHtml}
      />
      <div>
        <FieldLabel
          icon={<Tag className="w-3 h-3" />}
          text="7 Backend Keywords"
        />
        <div className="grid sm:grid-cols-2 gap-1.5">
          {kdp.keywords.map((kw, i) => (
            <KeywordChip key={i} index={i + 1} value={kw} />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel
          icon={<ListTree className="w-3 h-3" />}
          text="Suggested KDP Categories"
        />
        <div className="space-y-1.5">
          {kdp.categories.map((cat, i) => (
            <KeywordChip key={i} index={i + 1} value={cat} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-neutral-300">
        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-semibold">
          Suggested price: ${kdp.suggestedPriceUsd}
        </span>
        <span className="text-neutral-500">· {pageCount} pages</span>
      </div>
      {kdp.notes && (
        <p className="text-[11px] text-amber-200/80 italic">✦ {kdp.notes}</p>
      )}
    </div>
  );
}

function EtsyView({ etsy }: { etsy: EtsyMetadata }) {
  return (
    <div className="space-y-3">
      <MetadataField
        label={`Etsy title (${etsy.title.length}/140 chars)`}
        value={etsy.title}
      />
      <MetadataField
        label="Etsy description (plain text)"
        value={etsy.description}
        multiline
      />
      <div>
        <FieldLabel
          icon={<Tag className="w-3 h-3" />}
          text="13 Etsy tags (≤20 chars each)"
        />
        <div className="grid sm:grid-cols-2 gap-1.5">
          {etsy.tags.map((tag, i) => (
            <KeywordChip key={i} index={i + 1} value={tag} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GumroadView({ gumroad }: { gumroad: GumroadMetadata }) {
  return (
    <div className="space-y-3">
      <MetadataField
        label={`Product name (${gumroad.name.length}/140)`}
        value={gumroad.name}
      />
      <MetadataField
        label={`One-line summary (${gumroad.summary.length}/280)`}
        value={gumroad.summary}
      />
      <MetadataField
        label="Description (paste into Gumroad description field)"
        value={gumroad.description}
        multiline
      />
      <div>
        <FieldLabel
          icon={<ListTree className="w-3 h-3" />}
          text={`Additional information (${gumroad.additionalInfo.length})`}
        />
        <div className="space-y-1">
          {gumroad.additionalInfo.map((row, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs"
            >
              <span className="text-violet-400 font-mono shrink-0">
                {i + 1}.
              </span>
              <span className="font-semibold text-neutral-100 shrink-0">
                {row.label}
              </span>
              <span className="text-neutral-400">—</span>
              <span className="text-neutral-300 truncate">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel icon={<Tag className="w-3 h-3" />} text="Gumroad tags" />
        <div className="grid sm:grid-cols-2 gap-1.5">
          {gumroad.tags.map((tag, i) => (
            <KeywordChip key={i} index={i + 1} value={tag} />
          ))}
        </div>
      </div>
      <MetadataField label="Gumroad category" value={gumroad.category} />
    </div>
  );
}

function PinterestView({ pin }: { pin: PinterestPin }) {
  return (
    <div className="space-y-3">
      <MetadataField
        label={`Pin title (${pin.title.length}/100)`}
        value={pin.title}
      />
      <MetadataField
        label={`Pin description (${pin.description.length}/800)`}
        value={pin.description}
        multiline
      />
    </div>
  );
}

function InstagramView({ post }: { post: InstagramPost }) {
  return (
    <div className="space-y-3">
      <MetadataField label="Caption" value={post.caption} multiline />
      <div>
        <FieldLabel icon={<Tag className="w-3 h-3" />} text="5 hashtags" />
        <div className="grid sm:grid-cols-2 gap-1.5">
          {post.hashtags.map((tag, i) => (
            <KeywordChip key={i} index={i + 1} value={tag} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TwitterView({ post }: { post: TwitterPost }) {
  return (
    <div className="space-y-3">
      <MetadataField
        label={`Tweet (${post.caption.length}/280) — add your link before posting`}
        value={post.caption}
        multiline
      />
    </div>
  );
}

function FieldLabel({
  icon,
  text,
}: {
  icon?: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">
        {text}
      </span>
    </div>
  );
}

function MetadataField({
  label,
  value,
  multiline = false,
  mono = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">
          {label}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-neutral-400 hover:text-white hover:bg-white/5"
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {multiline ? (
        <textarea
          readOnly
          value={value}
          rows={12}
          className={`w-full px-3 py-2.5 rounded-lg bg-black/50 border border-white/10 text-sm leading-relaxed ${
            mono ? "font-mono text-xs" : ""
          } text-neutral-200 resize-y focus:outline-none min-h-[200px]`}
        />
      ) : (
        <input
          readOnly
          value={value}
          className={`w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs ${
            mono ? "font-mono" : ""
          } text-neutral-200 focus:outline-none`}
        />
      )}
    </div>
  );
}

function KeywordChip({ index, value }: { index: number; value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-neutral-300 hover:bg-violet-500/10 hover:border-violet-500/30 transition-colors text-left"
    >
      <span className="text-violet-400 font-mono shrink-0">{index}.</span>
      <span className="flex-1 truncate">{value}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 text-neutral-500 shrink-0" />
      )}
    </button>
  );
}

function DownloadPackageButton({
  bookName,
  pageCount,
  metadata,
}: {
  bookName: string;
  pageCount: number;
  metadata: KdpMetadata;
}) {
  const [building, setBuilding] = useState(false);
  const onClick = async () => {
    setBuilding(true);
    try {
      const bytes = await buildKdpPackagePdf({
        bookName,
        pageCount,
        metadata,
      });
      const blob = new Blob([new Uint8Array(bytes)], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bookName.replace(/[^a-z0-9]+/gi, "_")}_listing_package.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setBuilding(false);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={building}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-black text-white hover:bg-neutral-800 disabled:opacity-60 shadow"
    >
      {building ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <FileDown className="w-3.5 h-3.5" />
      )}
      Download listing package PDF
    </button>
  );
}

function CopyAllButton({ metadata }: { metadata: KdpMetadata }) {
  const [copied, setCopied] = useState(false);
  const onClick = () => {
    const sections: string[] = [
      "=== AMAZON KDP ===",
      `TITLE\n${metadata.title}`,
      metadata.subtitle ? `\nSUBTITLE\n${metadata.subtitle}` : "",
      `\nDESCRIPTION\n${metadata.descriptionText}`,
      `\nKEYWORDS\n${metadata.keywords.map((k, i) => `${i + 1}. ${k}`).join("\n")}`,
      `\nCATEGORIES\n${metadata.categories.map((c, i) => `${i + 1}. ${c}`).join("\n")}`,
      `\nSUGGESTED PRICE\n$${metadata.suggestedPriceUsd}`,
    ];
    if (metadata.etsy) {
      sections.push(
        "\n\n=== ETSY ===",
        `TITLE (≤140)\n${metadata.etsy.title}`,
        `\nDESCRIPTION\n${metadata.etsy.description}`,
        `\nTAGS (13)\n${metadata.etsy.tags.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
      );
    }
    if (metadata.gumroad) {
      sections.push(
        "\n\n=== GUMROAD ===",
        `NAME\n${metadata.gumroad.name}`,
        `\nSUMMARY\n${metadata.gumroad.summary}`,
        `\nDESCRIPTION\n${metadata.gumroad.description}`,
        `\nADDITIONAL INFO\n${metadata.gumroad.additionalInfo.map((row, i) => `${i + 1}. ${row.label} — ${row.value}`).join("\n")}`,
        `\nTAGS\n${metadata.gumroad.tags.join(", ")}`,
        `\nCATEGORY\n${metadata.gumroad.category}`,
      );
    }
    if (metadata.pinterest) {
      sections.push(
        "\n\n=== PINTEREST ===",
        `TITLE (≤100)\n${metadata.pinterest.title}`,
        `\nDESCRIPTION (≤800)\n${metadata.pinterest.description}`,
      );
    }
    if (metadata.instagram) {
      sections.push(
        "\n\n=== INSTAGRAM ===",
        `CAPTION\n${metadata.instagram.caption}`,
        `\nHASHTAGS\n${metadata.instagram.hashtags.join(" ")}`,
      );
    }
    if (metadata.twitter) {
      sections.push("\n\n=== X / TWITTER ===", metadata.twitter.caption);
    }
    void navigator.clipboard.writeText(sections.filter(Boolean).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 text-white border border-white/15 hover:bg-white/10"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {copied ? "Copied all" : "Copy all as text"}
    </button>
  );
}
