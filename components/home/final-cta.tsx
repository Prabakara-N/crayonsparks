import Link from "next/link";
import { Spotlight } from "@/components/ui/spotlight";
import { Wand2, Sparkles } from "lucide-react";

const SAMPLE_COVERS = [
  "/visuals/covers/farm-animals.png",
  "/visuals/covers/dinosaurs.png",
  "/visuals/covers/woodland-baby-animals.png",
  "/visuals/covers/happy-farm-animals.jpg",
  "/visuals/covers/wild-animals.png",
];

export function FinalCta() {
  return (
    <section className="relative py-28 bg-black overflow-hidden">
      <Spotlight className="-top-20 left-1/2 -translate-x-1/2" fill="#8b5cf6" />
      <div className="absolute inset-0 grid-pattern opacity-15 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,black_75%)] pointer-events-none" />

      {/* Faded sample-image grid behind the content */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center gap-3 md:gap-5 opacity-30 mix-blend-screen pointer-events-none px-4">
        {SAMPLE_COVERS.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden
            className="hidden md:block w-44 h-56 object-cover rounded-2xl border border-white/5"
            style={{
              transform: `translateY(${(i % 2 === 0 ? -1 : 1) * 12}px) rotate(${(i - 2) * 2}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-medium text-violet-200 backdrop-blur mb-6">
          <Wand2 className="w-3 h-3" />
          Built for Amazon KDP, Etsy, Gumroad
        </div>
        <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white">
          Your first book is{" "}
          <span className="bg-clip-text text-transparent bg-linear-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
            free
          </span>
          .
        </h2>
        <p className="mt-5 text-base md:text-lg text-neutral-300 max-w-xl mx-auto leading-relaxed">
          Try the generator with your own Gemini API key. 20 pages, full
          KDP-ready PDF, no account required.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            href="/sparky-ai"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm md:text-base font-semibold text-white bg-linear-to-r from-violet-500 via-indigo-400 to-cyan-400 shadow-lg shadow-violet-500/40 hover:shadow-xl hover:shadow-violet-500/50 hover:scale-105 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Start generating
          </Link>
          <Link
            href="/pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm md:text-base font-medium text-white bg-white/5 hover:bg-white/10 border border-white/15 backdrop-blur transition-colors"
          >
            View pricing
          </Link>
        </div>

        <p className="mt-10 text-[11px] uppercase tracking-wider text-neutral-500">
          CrayonSparks · 14 themes · ~3 min per book
        </p>
      </div>
    </section>
  );
}
