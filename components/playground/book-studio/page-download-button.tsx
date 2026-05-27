"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { StoryBubble } from "./types";

interface PageDownloadButtonProps {
  dataUrl: string;
  filename: string;
  bubbles?: StoryBubble[];
}

export function PageDownloadButton({
  dataUrl,
  filename,
  bubbles,
}: PageDownloadButtonProps) {
  const [baking, setBaking] = useState(false);

  const triggerDownload = (urlToSave: string) => {
    const link = document.createElement("a");
    link.href = urlToSave;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!bubbles || bubbles.length === 0) {
      triggerDownload(dataUrl);
      return;
    }
    setBaking(true);
    try {
      const res = await fetch("/api/bake-page-bubbles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl, bubbles }),
      });
      const json = (await res.json()) as { dataUrl?: string; error?: string };
      if (!res.ok || !json.dataUrl) {
        throw new Error(json.error || "Bake failed");
      }
      triggerDownload(json.dataUrl);
    } catch {
      triggerDownload(dataUrl);
    } finally {
      setBaking(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={baking}
      aria-label="Download page"
      title={baking ? "Baking bubbles…" : "Download"}
      className="absolute bottom-3 right-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm transition-opacity duration-150 hover:bg-black/90 hover:text-violet-200 focus:opacity-100 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 disabled:opacity-60"
    >
      {baking ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </button>
  );
}
