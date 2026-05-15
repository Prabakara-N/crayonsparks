"use client";

import { useState } from "react";
import { Loader2, FileDown } from "lucide-react";
import type { KdpMetadata } from "@/lib/kdp-metadata";
import { buildKdpPackagePdf } from "@/lib/kdp-package-pdf";

interface DownloadPackageButtonProps {
  bookName: string;
  pageCount: number;
  metadata: KdpMetadata;
}

export function DownloadPackageButton({
  bookName,
  pageCount,
  metadata,
}: DownloadPackageButtonProps) {
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
