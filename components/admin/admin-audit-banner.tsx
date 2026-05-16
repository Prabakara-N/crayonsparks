import { ShieldAlert } from "lucide-react";

export function AdminAuditBanner() {
  return (
    <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 mb-4 px-4 sm:px-6 lg:px-8 py-1.5 bg-amber-500/15 border-y border-amber-500/30 text-amber-200 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2">
      <ShieldAlert className="w-3.5 h-3.5" />
      Admin view — all actions are audited.
    </div>
  );
}
