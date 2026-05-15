"use client";

import { ModelPicker } from "@/components/playground/model-picker";
import type { ImageModel } from "@/lib/constants";
import type { RefineContext } from "./types";

interface RefineHeaderProps {
  context: RefineContext;
  title?: string;
  subtitle?: string;
  activeModel: ImageModel;
  availableModels: readonly ImageModel[];
  onModelChange: (model: ImageModel) => void;
  busy: boolean;
}

function contextLabel(context: RefineContext): string {
  if (context === "cover") return "Cover";
  if (context === "back-cover") return "Back cover";
  if (context === "page") return "Page";
  return "Image";
}

function modelPickerTitle(context: RefineContext): string {
  if (context === "cover")
    return "Front cover refines support all three Nano Banana models — Pro for premium thumbnail fidelity.";
  if (context === "back-cover")
    return "Back covers are minimal layouts — Flash models render the tagline + barcode safe-zone cleanly without Pro's added cost.";
  return "Interior surfaces use Flash to keep B&W line art clean — Pro tends to over-render with shading the quality gate rejects.";
}

export function RefineHeader({
  context,
  title,
  subtitle,
  activeModel,
  availableModels,
  onModelChange,
  busy,
}: RefineHeaderProps) {
  return (
    <div className="px-5 py-3 border-b border-white/10 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
      <div className="min-w-0 flex-1">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-linear-to-r from-violet-500/15 to-cyan-500/15 border border-violet-500/30 text-[10px] font-semibold uppercase tracking-wider text-violet-300 mb-1.5">
          {contextLabel(context)} · Refine chat
        </div>
        <h3 className="font-display text-base font-semibold text-white">
          {title ?? "Refine with Sparky"}
        </h3>
        {subtitle && (
          <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <ModelPicker
        label="Model"
        value={activeModel}
        options={availableModels}
        onChange={onModelChange}
        disabled={busy}
        title={modelPickerTitle(context)}
      />
    </div>
  );
}
