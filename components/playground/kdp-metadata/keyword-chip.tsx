"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface KeywordChipProps {
  index: number;
  value: string;
}

export function KeywordChip({ index, value }: KeywordChipProps) {
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
