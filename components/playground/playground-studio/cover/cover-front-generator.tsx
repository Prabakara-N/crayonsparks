"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Wand2, RefreshCw } from "lucide-react";
import { useAuthContext } from "@/components/auth/auth-provider";
import { ReferenceImageField } from "@/components/ui/reference-image-field";
import { DEFAULT_COVER_MODEL } from "@/lib/constants";
import { fetchCoverBrief } from "@/lib/functions/client/fetch-cover-brief";
import { buildFrontCoverPrompt } from "./cover-prompt";
import { CoverPdfUpload } from "./cover-pdf-upload";
import { CoverSellingToggle } from "./cover-selling-toggle";
import type { CoverBrief, CoverSelling } from "./cover-brief-types";
import type { CoverTrim } from "./cover-trim-config";

interface CoverFrontGeneratorProps {
  trim: CoverTrim;
  bookTitle: string;
  onBookTitleChange: (value: string) => void;
  hasArt: boolean;
  onArt: (dataUrl: string) => void;
}

export function CoverFrontGenerator({
  trim,
  bookTitle,
  onBookTitleChange,
  hasArt,
  onArt,
}: CoverFrontGeneratorProps) {
  const { user } = useAuthContext();
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [selling, setSelling] = useState(false);
  const [brief, setBrief] = useState<CoverBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePdf(file: File) {
    setPdfBusy(true);
    setError(null);
    try {
      const b = await fetchCoverBrief({ pdf: file, wantSelling: selling });
      if (!b.isBook) {
        setError(b.notBookReason || "That file doesn't look like a book.");
        return;
      }
      setBrief(b);
      if (b.summary) setDescription(b.summary);
      if (b.title && !bookTitle.trim()) onBookTitleChange(b.title);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the PDF.");
    } finally {
      setPdfBusy(false);
    }
  }

  async function resolveSelling(seed: string): Promise<CoverSelling | undefined> {
    if (!selling) return undefined;
    if (brief?.selling) return brief.selling;
    const b = await fetchCoverBrief({ text: seed, wantSelling: true });
    setBrief(b);
    return b.selling;
  }

  async function generate() {
    const desc = description.trim();
    const title = bookTitle.trim();
    if (!desc && !title && !brief) {
      setError("Give a title, describe the book, or upload a PDF.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const sellingCopy = await resolveSelling(desc || title);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "raw",
          prompt: buildFrontCoverPrompt({
            title: bookTitle.trim(),
            description: desc,
            selling: sellingCopy,
          }),
          aspectRatio: trim.frontAspect,
          referenceDataUrl: reference ?? undefined,
          model: DEFAULT_COVER_MODEL,
        }),
      });
      const json = (await res.json()) as { dataUrl?: string; error?: string };
      if (!res.ok || !json.dataUrl) {
        throw new Error(json.error || "Generation failed.");
      }
      onArt(json.dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-neutral-500">
        Give any one — a title, a description, or upload the book PDF. Sparky
        fills in the rest.
      </p>
      <label className="block">
        <span className="block text-xs font-medium text-neutral-300 mb-1.5">
          Book title
        </span>
        <input
          type="text"
          value={bookTitle}
          onChange={(e) => onBookTitleChange(e.target.value)}
          placeholder="e.g. The Midnight Garden"
          className="w-full h-10 rounded-lg border border-white/10 bg-black/50 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/60"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-medium text-neutral-300 mb-1.5">
          What is the book about? <span className="text-neutral-500">(optional)</span>
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe the book — genre, mood, who it's for, key imagery. Any genre (kids, fantasy, business, cookbook…). Sparky picks a fitting cover style."
          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/50 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/60 resize-y"
        />
      </label>

      <CoverPdfUpload busy={pdfBusy} onFile={(f) => void handlePdf(f)} />

      <CoverSellingToggle value={selling} onChange={setSelling} disabled={busy} />

      <ReferenceImageField
        value={reference}
        onChange={setReference}
        compact
        label="Reference (optional)"
        helper="Upload your existing book or a style you like — Sparky designs from it."
      />

      {error && <p className="text-xs text-red-300">{error}</p>}

      {!user ? (
        <Link
          href="/login?next=/playground/cover"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white/5 border border-white/15 text-white hover:bg-white/10"
        >
          Sign in to generate
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => void generate()}
          disabled={busy || pdfBusy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-linear-to-r from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/30 hover:shadow-xl disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : hasArt ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          {hasArt ? "Regenerate front art" : "Generate front cover"}
        </button>
      )}
    </div>
  );
}
