import Image from "next/image";
import { BrandCanvas } from "./brand-canvas";

export function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-[#0a0a0f] lg:block">
      <BrandCanvas />
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-5 px-10 text-white">
        <div className="flex flex-row items-center gap-3">
          <Image
            src="/logo-mark.svg"
            alt="CrayonSparks"
            width={48}
            height={48}
            className="size-12 rounded-xl shadow-xl shadow-violet-500/30"
            priority
          />
          <p className="font-display text-3xl xl:text-4xl font-light tracking-tight text-shadow-black/80 text-shadow-lg">
            CrayonSparks
          </p>
        </div>
        <p className="max-w-sm text-center text-sm leading-relaxed text-white/55">
          Generate publish-ready coloring books and story books for Amazon KDP
          in minutes — AI-illustrated covers, interior pages, and metadata.
        </p>
      </div>
    </div>
  );
}
