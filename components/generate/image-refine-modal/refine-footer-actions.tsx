"use client";

import { Download, RefreshCw, Trash2 } from "lucide-react";

interface RefineFooterActionsProps {
  hasTurns: boolean;
  busy: boolean;
  onClearChat: () => void;
  showUseVersion: boolean;
  onAcceptVersion: () => void;
  downloadHref: string;
  downloadName: string;
}

export function RefineFooterActions({
  hasTurns,
  busy,
  onClearChat,
  showUseVersion,
  onAcceptVersion,
  downloadHref,
  downloadName,
}: RefineFooterActionsProps) {
  return (
    <div className="px-4 py-2.5 border-t border-white/10 flex items-center gap-2 flex-wrap">
      {hasTurns && (
        <button
          type="button"
          onClick={onClearChat}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-neutral-400 hover:text-white hover:bg-white/5 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear chat
        </button>
      )}
      <div className="ml-auto flex items-center gap-2">
        {showUseVersion && (
          <button
            type="button"
            onClick={onAcceptVersion}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50 shadow"
          >
            <RefreshCw className="w-3 h-3" />
            Use this version
          </button>
        )}
        <a
          href={downloadHref}
          download={downloadName}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-neutral-200"
        >
          <Download className="w-3 h-3" />
          PNG
        </a>
      </div>
    </div>
  );
}
