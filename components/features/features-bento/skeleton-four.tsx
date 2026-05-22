import { cn } from "@/lib/utils";
import { LinkPreview } from "@/components/ui/link-preview";
import { SKELETON_FOUR_PLATFORMS } from "./features-bento-constants";

export function SkeletonFour() {
  return (
    <div className="relative flex h-full flex-col items-start justify-start gap-5 px-2 py-6">
      <div className="text-base md:text-lg leading-relaxed text-neutral-300 max-w-md">
        Same source, four revenue streams.{" "}
        <LinkPreview
          url="https://kdp.amazon.com"
          className="font-semibold bg-clip-text text-transparent bg-linear-to-r from-violet-400 via-indigo-300 to-cyan-300"
        >
          Amazon KDP
        </LinkPreview>{" "}
        for paperbacks,{" "}
        <LinkPreview
          url="https://www.etsy.com/market/coloring_book"
          className="font-semibold bg-clip-text text-transparent bg-linear-to-r from-rose-400 to-orange-300"
        >
          Etsy
        </LinkPreview>{" "}
        for printables,{" "}
        <LinkPreview
          url="https://gumroad.com"
          className="font-semibold bg-clip-text text-transparent bg-linear-to-r from-pink-400 to-fuchsia-300"
        >
          Gumroad
        </LinkPreview>{" "}
        for direct sales, and{" "}
        <LinkPreview
          url="https://pinterest.com"
          className="font-semibold bg-clip-text text-transparent bg-linear-to-r from-red-400 to-rose-400"
        >
          Pinterest
        </LinkPreview>{" "}
        as the always-on traffic engine.
      </div>

      <ul className="space-y-3 w-full max-w-md">
        {SKELETON_FOUR_PLATFORMS.map((p) => (
          <li
            key={p.name}
            className="flex flex-col gap-1 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
          >
            <LinkPreview
              url={p.url}
              className={cn(
                "text-sm font-semibold bg-clip-text text-transparent bg-linear-to-r",
                p.gradient
              )}
            >
              {p.name}
            </LinkPreview>
            <span className="text-xs text-neutral-400 leading-relaxed">
              {p.detail}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-neutral-500">
        Hover any platform to peek the live page.
      </p>
    </div>
  );
}
