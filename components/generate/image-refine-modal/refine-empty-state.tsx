import { Sparkles } from "lucide-react";
import type { RefineContext } from "./types";

interface RefineEmptyStateProps {
  context: RefineContext;
}

export function RefineEmptyState({ context }: RefineEmptyStateProps) {
  const isStory =
    context === "story-page" ||
    context === "story-cover" ||
    context === "story-back-cover";
  return (
    <div className="text-center text-xs text-neutral-500 py-6">
      <Sparkles className="w-5 h-5 mx-auto mb-2 text-violet-400" />
      <p className="leading-relaxed">
        Tell Sparky what to change.
        <br />
        Try{" "}
        <span className="text-violet-300">
          &quot;match the bear from page 3&quot;
        </span>
        {isStory ? "." : " or attach a reference image."}
      </p>
    </div>
  );
}
