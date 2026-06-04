import Link from "next/link";
import { Spotlight } from "@/components/ui/spotlight";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { HeroPrimaryCta } from "@/components/home/hero-cta";

export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black antialiased pt-16">
      {/* Aurora base layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -inset-[10%] opacity-40 blur-2xl will-change-transform animate-aurora"
          style={{
            backgroundImage:
              "repeating-linear-gradient(100deg, #0ea5e9 10%, #8b5cf6 15%, #6366f1 20%, #06b6d4 25%, #a78bfa 30%)",
            backgroundSize: "200% 200%",
            mixBlendMode: "screen",
            maskImage:
              "radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)",
          }}
        />
      </div>
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#8b5cf6" />
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_70%)]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white">
          Create kids&apos; books
          <br />
          <span className="gradient-text">in minutes, not months</span>
        </h1>

        <div className="mt-6">
          <TypewriterEffect
            words={[
              { text: "Story" },
              { text: "books" },
              { text: "·" },
              { text: "Coloring" },
              { text: "books" },
              { text: "·" },
              { text: "Activity", className: "text-cyan-400" },
              { text: "books", className: "text-cyan-400" },
              { text: "(soon)", className: "text-cyan-400/60" },
            ]}
            className="text-lg md:text-xl text-neutral-300"
          />
        </div>

        <p className="mt-6 max-w-2xl mx-auto text-neutral-400 text-base md:text-lg leading-relaxed">
          Turn any idea into a beautiful kids&apos; book your child (or your
          customers) will love. Publish on Amazon KDP, gift one-of-a-kind
          books for{" "}
          <span className="text-violet-300">birthdays</span>,{" "}
          <span className="text-violet-300">return gifts</span> and{" "}
          <span className="text-violet-300">memory keepsakes</span> — or
          print screen-free fun the whole family will treasure.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <HeroPrimaryCta />
          <Link
            href="/features"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 md:h-14 px-6 md:px-7 rounded-full text-sm md:text-base font-medium text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur transition-colors"
          >
            See features
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { v: "Minutes", l: "Idea → Printable PDF" },
            { v: "~8s", l: "Per page" },
            { v: "KDP", l: "Print-ready 8.5×11 / 6×9" },
          ].map((s) => (
            <div
              key={s.l}
              className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur"
            >
              <div className="text-2xl md:text-3xl font-bold gradient-text">{s.v}</div>
              <div className="text-xs text-neutral-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
