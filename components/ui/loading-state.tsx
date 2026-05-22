import { Loader2 } from "lucide-react";

/** Centered spinner + label — for full-panel loads where a skeleton
 *  doesn't map cleanly to the content shape. */
export function LoadingState({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <Loader2 className="w-6 h-6 animate-spin text-violet-300" />
      <p className="text-sm text-neutral-400">{label}</p>
    </div>
  );
}
