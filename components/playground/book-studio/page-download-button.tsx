"use client";

import { Download } from "lucide-react";
import { fireConfettiBurst } from "@/components/ui/confetti-burst";

interface PageDownloadButtonProps {
  dataUrl: string;
  filename: string;
}

export function PageDownloadButton({
  dataUrl,
  filename,
}: PageDownloadButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      fireConfettiBurst(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
    }, 350);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Download page"
      title="Download"
      className="absolute bottom-3 right-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm transition-opacity duration-150 hover:bg-black/90 hover:text-violet-200 focus:opacity-100 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
    >
      <Download className="h-4 w-4" />
    </button>
  );
}
