"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface MetadataFieldProps {
  label: string;
  value: string;
  multiline?: boolean;
  mono?: boolean;
}

export function MetadataField({
  label,
  value,
  multiline = false,
  mono = false,
}: MetadataFieldProps) {
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
