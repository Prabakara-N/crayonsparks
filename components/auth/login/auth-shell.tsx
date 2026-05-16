import type { ReactNode } from "react";
import { BrandPanel } from "./brand-panel";

interface AuthShellProps {
  heading: string;
  subheading: string;
  children: ReactNode;
  footerSlot: ReactNode;
}

export function AuthShell({
  heading,
  subheading,
  children,
  footerSlot,
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 bg-white lg:grid-cols-2 dark:bg-neutral-900">
      <BrandPanel />
      <div className="relative flex items-center justify-center bg-white px-6 py-10 md:px-12 dark:bg-neutral-900">
        <div className="w-full max-w-md">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {heading}
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {subheading}
          </p>
          <div className="mt-8">{children}</div>
          {footerSlot}
        </div>
      </div>
    </div>
  );
}
