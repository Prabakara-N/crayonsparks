import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-4 border-b border-white/10">
      <div className="min-w-0">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-neutral-400 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
