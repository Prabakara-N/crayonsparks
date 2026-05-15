import { CheckCircle2, Loader2, Wand2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromptItem } from "./types";

export function StatusBadge({ status }: { status: PromptItem["status"] }) {
  const map: Record<
    PromptItem["status"],
    { cls: string; icon: React.ReactNode; label: string }
  > = {
    pending: {
      cls: "bg-zinc-800 border border-white/10 text-neutral-400",
      icon: <Wand2 className="w-3 h-3" />,
      label: "Pending",
    },
    queued: {
      cls: "bg-zinc-800 border border-white/10 text-neutral-300",
      icon: <Loader2 className="w-3 h-3" />,
      label: "Queued",
    },
    generating: {
      cls: "bg-violet-500/20 border border-violet-500/40 text-violet-200",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      label: "Generating",
    },
    done: {
      cls: "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: "Done",
    },
    error: {
      cls: "bg-red-500/20 border border-red-500/40 text-red-200",
      icon: <XCircle className="w-3 h-3" />,
      label: "Error",
    },
  };
  const v = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur",
        v.cls,
      )}
    >
      {v.icon}
      {v.label}
    </span>
  );
}
