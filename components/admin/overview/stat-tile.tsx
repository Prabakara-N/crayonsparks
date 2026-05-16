import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}

export function StatTile({ icon: Icon, label, value, hint }: StatTileProps) {
  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
          {label}
        </span>
        <Icon className="w-4 h-4 text-amber-300" />
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
