import { Loader2, Check, AlertTriangle, Clock } from "lucide-react";
import type { PlatformStatus } from "@/lib/kdp-metadata";

export function StatusDot({ status }: { status: PlatformStatus }) {
  if (status === "loading")
    return <Loader2 className="w-3 h-3 animate-spin text-violet-300" />;
  if (status === "done")
    return <Check className="w-3 h-3 text-emerald-400" />;
  if (status === "error")
    return <AlertTriangle className="w-3 h-3 text-red-400" />;
  return <Clock className="w-3 h-3 text-neutral-600" />;
}
