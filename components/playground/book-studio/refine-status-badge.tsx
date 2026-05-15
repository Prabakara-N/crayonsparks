import { CheckCircle2, Loader2 } from "lucide-react";

// Replaces StatusBadge while a background refine is in flight (or just
// finished) so the card communicates "your edit is still running" / "your
// edit landed". Auto-clears via the parent's setTimeout once done.
export function RefineStatusBadge({ state }: { state: "running" | "done" }) {
  if (state === "running") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur bg-amber-500/20 border border-amber-500/40 text-amber-100"
        title="Refine running in the background"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Refining…
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur bg-cyan-500/20 border border-cyan-500/40 text-cyan-100"
      title="Refine just finished and the new image was applied"
    >
      <CheckCircle2 className="w-3 h-3" />
      Refined
    </span>
  );
}
