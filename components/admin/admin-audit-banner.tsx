import { ShieldAlert } from "lucide-react";

export function AdminAuditBanner() {
  return (
    <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 mb-6 px-4 sm:px-6 lg:px-8 py-2 bg-zinc-950/80 backdrop-blur-md border-y border-amber-500/20 text-amber-200/85 text-[10px] font-medium uppercase tracking-[0.18em] flex items-center gap-2">
      <ShieldAlert className="w-3 h-3 text-amber-400/80" />
      Admin view — all actions are audited
    </div>
  );
}
