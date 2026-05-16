import { Sparkles } from "lucide-react";

export function ComingSoonTag({ label = "Coming soon" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-violet-200 bg-violet-500/15 border border-violet-500/30">
      <Sparkles className="w-3 h-3" />
      {label}
    </span>
  );
}
