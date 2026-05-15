"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { KdpMetadata } from "@/lib/kdp-metadata";

export function CopyAllButton({ metadata }: { metadata: KdpMetadata }) {
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
