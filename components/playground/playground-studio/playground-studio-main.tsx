"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wand2, Loader2, Sparkles, X, RefreshCw, BookCopy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/components/auth/auth-provider";
import {
  savePendingAction,
  consumePendingAction,
} from "@/lib/auth/pending-action";
import { ReferenceImageField } from "@/components/ui/reference-image-field";
import { ModelPicker } from "@/components/playground/model-picker";
import { AspectRatioPicker } from "@/components/playground/aspect-ratio-picker";
import {
  ALL_IMAGE_MODELS,
  INTERIOR_MODEL_OPTIONS,
  DEFAULT_INTERIOR_MODEL,
  type ImageModel,
} from "@/lib/constants";
import type {
  AspectRatio,
  ImageCategory,
  Status,
  Version,
} from "./types";
import { CategoryDropdown } from "./category-dropdown";
import { ResultsGallery } from "./results-gallery";
import { PlaygroundModal } from "./playground-modal";
import { VersionRefineModal } from "./version-refine-modal";

export function PlaygroundStudio() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("3:4");
  const [category, setCategory] = useState<ImageCategory>("generic");
  const [ideas, setIdeas] = useState<string[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  const [ideasSeed, setIdeasSeed] = useState(0);
  const coloringBookMode = category === "coloring-page";
  // Image model for single-image generation. Coloring-book mode narrows the
  // dropdown to the two Flash variants (matching the bulk-book interior
  // pages convention); raw mode opens up the full lineup including Pro.
  // The active list is computed below from `coloringBookMode`.
  const [model, setModel] = useState<ImageModel>(DEFAULT_INTERIOR_MODEL);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const availableModels: readonly ImageModel[] = coloringBookMode
    ? INTERIOR_MODEL_OPTIONS
    : ALL_IMAGE_MODELS;

  // When the user toggles coloring-book mode, the previously-selected model
  // may no longer be in the active option list (e.g. they had Pro selected
  // and just turned coloring-book mode ON). Snap to the workhorse default
  // so the <select> never shows a value that isn't actually rendered.
  useEffect(() => {
    if (!availableModels.includes(model)) {
      setModel(DEFAULT_INTERIOR_MODEL);
    }
  }, [availableModels, model]);

  const [versions, setVersions] = useState<Version[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [pendingGenerate, setPendingGenerate] = useState(false);
  const restoredRef = useRef(false);

  const current = versions[currentIndex];

  const fetchIdeas = useCallback(
    async (cat: ImageCategory, seed: number) => {
      if (cat === "generic") return;
      setIdeasLoading(true);
      setIdeasError(null);
      try {
        const res = await fetch("/api/single-image-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: cat, variantSeed: seed }),
        });
        const data = (await res.json()) as
          | { ideas: string[] }
          | { error: string };
        if (!res.ok || "error" in data) {
          throw new Error("error" in data ? data.error : "Idea fetch failed.");
        }
        setIdeas(data.ideas);
      } catch (err: unknown) {
        setIdeasError(
          err instanceof Error ? err.message : "Could not fetch ideas.",
        );
      } finally {
        setIdeasLoading(false);
      }
    },
    [],
  );

  const runGenerate = useCallback(async () => {
    const text = prompt.trim();
    if (!text) return;
    if (!user) {
      savePendingAction({
        type: "single-image",
        returnTo: "/playground",
        payload: { prompt: text, aspectRatio, category, model },
      });
      router.push("/login?next=/playground");
      return;
    }
    setStatus("generating");
    setError(null);
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    try {
      const body = coloringBookMode
        ? {
            mode: "subject" as const,
            subject: text,
            age: "kids" as const,
            detail: "simple" as const,
            background: "scene" as const,
            aspectRatio,
            referenceDataUrl: reference ?? undefined,
            model,
          }
        : {
            mode: "raw" as const,
            prompt: text,
            aspectRatio,
            referenceDataUrl: reference ?? undefined,
            model,
          };
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { dataUrl?: string; error?: string };
      if (!res.ok || !json.dataUrl) throw new Error(json.error || "Generation failed");
      const v: Version = { dataUrl: json.dataUrl, model };
      setVersions((prev) => {
        const next = [...prev, v];
        setCurrentIndex(next.length - 1);
        return next;
      });
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Generation failed");
    }
  }, [prompt, aspectRatio, reference, coloringBookMode, model, category, user, router]);

  const runRefine = useCallback(async () => {
    const text = instruction.trim();
    if (!text || !current) return;
    setStatus("refining");
    setError(null);
    // Refine inherits the source version's model (or, for legacy versions
    // without a tag, falls back to the live dropdown). The new version is
    // tagged with the same model so subsequent refines stay on lineage.
    const sourceModel: ImageModel = current.model ?? model;
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: text,
          sourceDataUrl: current.dataUrl,
          aspectRatio,
          model: sourceModel,
        }),
      });
      const json = (await res.json()) as { dataUrl?: string; error?: string };
      if (!res.ok || !json.dataUrl) throw new Error(json.error || "Refinement failed");
      const newVersion: Version = {
        dataUrl: json.dataUrl,
        instruction: text,
        model: sourceModel,
      };
      setVersions((prev) => [...prev.slice(0, currentIndex + 1), newVersion]);
      setCurrentIndex((i) => i + 1);
      setInstruction("");
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Refinement failed");
    }
  }, [instruction, current, currentIndex, aspectRatio, model]);

  // Restore a draft saved before a login redirect. If the user is now
  // signed in, queue an auto-generate; otherwise just refill the form.
  useEffect(() => {
    if (authLoading || restoredRef.current) return;
    restoredRef.current = true;
    const action = consumePendingAction("single-image");
    const p = action?.payload as
      | {
          prompt?: string;
          aspectRatio?: AspectRatio;
          category?: ImageCategory;
          model?: ImageModel;
        }
      | undefined;
    if (!p) return;
    if (p.prompt) setPrompt(p.prompt);
    if (p.aspectRatio) setAspectRatio(p.aspectRatio);
    if (p.category) setCategory(p.category);
    if (p.model) setModel(p.model);
    if (user) setPendingGenerate(true);
  }, [authLoading, user]);

  useEffect(() => {
    if (pendingGenerate && prompt.trim() && status === "idle") {
      setPendingGenerate(false);
      void runGenerate();
    }
  }, [pendingGenerate, prompt, status, runGenerate]);

  const nav = (delta: number) => {
    setCurrentIndex((i) => Math.max(0, Math.min(versions.length - 1, i + delta)));
  };

  return (
    <>
      <div className="rounded-3xl p-6 md:p-8 bg-zinc-900/60 backdrop-blur-xl border border-white/10 space-y-5">
        <Link
          href="/playground/cover"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/5 border border-violet-500/40 hover:bg-violet-500/10 transition-colors"
        >
          <BookCopy className="w-4 h-4" />
          Make a book cover
        </Link>
        <div>
          <label className="block text-sm font-semibold text-neutral-200 mb-2">
            Category
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryDropdown
              value={category}
              onChange={(v) => {
                setCategory(v);
                setIdeas([]);
                setIdeasError(null);
              }}
              disabled={status === "generating"}
            />
            {category !== "generic" && (
              <button
                type="button"
                onClick={() => fetchIdeas(category, ideasSeed)}
                disabled={ideasLoading || status === "generating"}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-violet-500/15 border border-violet-500/40 text-violet-200 hover:bg-violet-500/25 disabled:opacity-50"
              >
                {ideasLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {ideas.length > 0 ? "More ideas" : "Give me ideas"}
              </button>
            )}
          </div>
          {ideasError && (
            <p className="text-[11px] text-red-300 mt-2">{ideasError}</p>
          )}
          {ideas.length > 0 && (
            <div className="mt-3 grid gap-1.5">
              {ideas.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => {
                    setPrompt(idea);
                    setIdeas([]);
                  }}
                  className="text-left text-xs px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-neutral-300 hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-white transition-colors"
                >
                  {idea}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  const next = ideasSeed + 1;
                  setIdeasSeed(next);
                  fetchIdeas(category, next);
                }}
                disabled={ideasLoading}
                className="self-start mt-1 text-[11px] text-violet-300 hover:text-violet-200 inline-flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw
                  className={cn("w-3 h-3", ideasLoading && "animate-spin")}
                />
                Suggest different ones
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-200 mb-2">
            Your prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runGenerate();
            }}
            placeholder="Describe what to draw — e.g. a friendly dragon sitting in a magical forest, full scene with trees and stars, thick black line art, coloring-book style…"
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 resize-y min-h-[120px]"
            disabled={status === "generating"}
          />
          <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-500">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px]">
                ⌘/Ctrl
              </kbd>{" "}
              +{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px]">
                Enter
              </kbd>{" "}
              to generate
            </span>
            <span className="font-mono">{prompt.length} chars</span>
          </div>
        </div>

        <ReferenceImageField
          value={reference}
          onChange={setReference}
          helper="Gemini will borrow style, palette, and composition from this image."
        />

        <div>
          <label className="block text-sm font-semibold text-neutral-200 mb-2">
            Aspect ratio
          </label>
          <AspectRatioPicker
            value={aspectRatio}
            onChange={setAspectRatio}
            disabled={status === "generating"}
          />
        </div>

        <div className="flex flex-col gap-1.5 px-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-neutral-300">
              Image model
            </span>
            <ModelPicker
              label=""
              value={model}
              options={availableModels}
              onChange={setModel}
              disabled={status === "generating"}
              title={
                coloringBookMode
                  ? "Coloring-page category uses the Flash tier — best for clean B&W line art at low cost."
                  : "Pro for premium one-off shots, Flash tiers for quick iterations."
              }
            />
          </div>
          {coloringBookMode && (
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Nano Banana 3 Pro is hidden for the coloring-page category — it&apos;s
              tuned for photorealism / shading, which the B&amp;W line-art quality
              gate rejects. Flash models give cleaner outlines, generate faster,
              and cost a fraction per page.
            </p>
          )}
        </div>

        <button
          onClick={runGenerate}
          disabled={!prompt.trim() || status === "generating"}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-violet-500 via-indigo-400 to-cyan-400 shadow-lg shadow-violet-500/40 hover:shadow-xl hover:shadow-violet-500/60 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {status === "generating" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          {status === "generating" ? "Generating…" : "Generate image"}
        </button>

        {status === "error" && error && (
          <div className="flex items-start gap-2 text-sm text-red-300">
            <X className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <ResultsGallery
        ref={resultsRef}
        versions={versions}
        currentIndex={currentIndex}
        onSelect={(i) => setCurrentIndex(i)}
        onOpen={() => setModalOpen(true)}
        generating={status === "generating"}
        aspectRatio={aspectRatio}
      />

      {/* Modal — portaled to body so stacking contexts don't trap it */}
      <PlaygroundModal
        open={modalOpen && !!current}
        onClose={() => setModalOpen(false)}
      >
        {modalOpen && current && (
          <VersionRefineModal
            current={current}
            versions={versions}
            currentIndex={currentIndex}
            status={status}
            error={error}
            instruction={instruction}
            onInstructionChange={setInstruction}
            onClose={() => setModalOpen(false)}
            onRefine={runRefine}
            onNav={nav}
          />
        )}
      </PlaygroundModal>

    </>
  );
}
