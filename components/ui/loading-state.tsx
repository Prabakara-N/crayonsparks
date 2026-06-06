import { Loader2 } from "lucide-react";

// Centered spinner + label for full-panel loads where a skeleton doesn't fit.
export function LoadingState({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="w-6 h-6 animate-spin text-violet-300" />
      <p className="text-sm text-neutral-400">{label}</p>
    </div>
  );
}
