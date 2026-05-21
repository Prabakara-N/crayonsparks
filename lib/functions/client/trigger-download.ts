"use client";

/**
 * Browser-side "save a Blob as a file" trigger. Creates a hidden <a>,
 * clicks it, then revokes the object URL. Used by every download
 * function in lib/functions/download-*.ts.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function safeFileName(input: string | undefined, fallback: string): string {
  const base = (input ?? fallback).replace(/[^a-z0-9]+/gi, "_");
  return base || fallback;
}
