import type { LucideIcon } from "lucide-react";
import { ComingSoonTag } from "./coming-soon-tag";

interface PlaceholderCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets?: string[];
}

export function PlaceholderCard({
  icon: Icon,
  title,
  description,
  bullets,
}: PlaceholderCardProps) {
  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 inline-flex items-center justify-center">
          <Icon className="w-4 h-4 text-violet-200" />
        </span>
        <ComingSoonTag />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-neutral-400 leading-relaxed">
        {description}
      </p>
      {bullets && bullets.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm text-neutral-300">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-violet-400 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
