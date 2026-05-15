import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  error?: string;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-red-200">
          {error ?? "Generation failed for this platform."}
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-100"
        >
          <RefreshCw className="w-3 h-3" /> Retry this tab
        </button>
      </div>
    </div>
  );
}
