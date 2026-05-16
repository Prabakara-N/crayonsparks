import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/account/page-header";
import { ComingSoonTag } from "@/components/account/coming-soon-tag";

interface ComingSoonSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  whenIt: string;
}

export function ComingSoonSection({
  title,
  description,
  icon: Icon,
  whenIt,
}: ComingSoonSectionProps) {
  return (
    <div>
      <PageHeader title={title} description={description} actions={<ComingSoonTag />} />
      <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-8 md:p-12 text-center">
        <span className="inline-flex w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-amber-200" />
        </span>
        <h3 className="font-display text-xl font-semibold text-white">
          Not wired yet
        </h3>
        <p className="mt-2 text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
          {whenIt}
        </p>
      </div>
    </div>
  );
}
