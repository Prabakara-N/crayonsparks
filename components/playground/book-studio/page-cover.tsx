import { Loader2, RefreshCw, Wand2, XCircle } from "lucide-react";
import type { PromptItem } from "./types";

export function PageCover({
  status,
  dataUrl,
  message,
  aspectClass,
  showFrame = false,
}: {
  status: PromptItem["status"] | "pending" | "generating" | "done" | "error";
  dataUrl?: string;
  message?: string;
  aspectClass: string;
  showFrame?: boolean;
}) {
  if (status === "done" && dataUrl) {
    return (
      <div className="absolute inset-0 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={message ?? ""}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ aspectRatio: aspectClass }}
        />
        {/* Border is in the image itself (Gemini draws it). No CSS overlay. */}
      </div>
    );
  }
  // status === "done" but dataUrl missing — happens after a sessionStorage
  // quota fallback dropped large image bytes on refresh. Show a clear
  // prompt to regenerate (instead of a confusing "Pending" wand state).
  if (status === "done" && !dataUrl) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-amber-950/30 text-amber-200 p-4 text-center">
        <RefreshCw className="w-7 h-7" />
        <p className="text-xs font-semibold">Image cleared from cache</p>
        <p className="text-[10px] opacity-80 max-w-[20ch]">
          Tap the card and click Regenerate to recreate it
        </p>
      </div>
    );
  }
  if (status === "generating" || status === "queued") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-violet-950/40 text-violet-200">
        <Loader2 className="w-7 h-7 animate-spin" />
        <p className="text-xs font-medium px-3 text-center">
          {message ?? "Generating…"}
        </p>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-950/40 text-red-200 p-4 text-center">
        <XCircle className="w-7 h-7" />
        <p className="text-xs">{message ?? "Failed"}</p>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-linear-to-br from-zinc-800 to-zinc-900 text-neutral-400">
      <Wand2 className="w-7 h-7" />
      <p className="text-xs font-medium px-3 text-center max-w-[12ch] truncate">
        {message ?? "Pending"}
      </p>
    </div>
  );
}
