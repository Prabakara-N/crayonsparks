import { Loader2 } from "lucide-react";
import type { ListingPlatform } from "@/lib/kdp-metadata";
import { TAB_CONFIG } from "./kdp-metadata-tab-config";

export function LoadingState({ platform }: { platform: ListingPlatform }) {
  const label = TAB_CONFIG.find((t) => t.id === platform)?.label ?? platform;
  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-5 flex items-center gap-3">
      <Loader2 className="w-4 h-4 animate-spin text-violet-300" />
      <div className="text-xs text-violet-100">
        Generating <strong>{label}</strong> listing… this usually takes 3–15
        seconds.
      </div>
    </div>
  );
}
