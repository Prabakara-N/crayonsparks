import Link from "next/link";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Spotlight } from "@/components/ui/spotlight";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { visualUrl } from "@/lib/visuals";
import { HeroPrimaryCta } from "@/components/home/hero-cta";
import { BooksShowcase } from "@/components/home/books-showcase";
import { buildSoftwareApplication, buildFaqPage } from "@/lib/seo-schema";
import {
  ArrowRight,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Zap,
  BookOpen,
  Pin,
  TrendingUp,
  ShoppingCart,
  Palette,
  Wand2,
} from "lucide-react";

function BentoHeader({
  image,
  fallback,
  gradient,
}: {
  image: string | null;
  fallback: React.ReactNode;
  gradient: string;
}) {
  return (
    <div
      className={`flex h-40 rounded-xl items-center justify-center relative overflow-hidden ${gradient}`}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        fallback
      )}
    </div>
  );
}

const faqSchema = buildFaqPage([
  {
    q: "What is CrayonSparks?",
    a:
      "CrayonSparks is an AI book studio that turns any idea into a finished kids' book in minutes. You can make story books (full-color picture books with dialogue), coloring books (B&W line art) and — soon — activity books (mazes, dot-to-dot, word search). Use it to self-publish on Amazon KDP, or print one-of-a-kind books for birthdays, return gifts and memory keepsakes.",
  },
  {
    q: "Can I make a custom story book starring my own child?",
    a:
      "Yes. Open Sparky AI, describe your child's name, age and the kind of story you want. CrayonSparks generates a full-color picture book where your child is the main character. Download the print-ready PDF and print it at any local print shop or upload to Amazon KDP.",
  },
  {
    q: "Is CrayonSparks good for Amazon KDP self-publishers?",
    a:
      "Yes — it is purpose-built for KDP. Every coloring-book PDF is 8.5×11 at 300 DPI with KDP-spec margins. Story books are 6×9 print-ready. Multi-marketplace publishing pushes to Amazon KDP, Etsy and Gumroad, and the built-in Pinterest engine drives traffic to your listings.",
  },
  {
    q: "How long does it take to make a book?",
    a:
      "About 3 to 8 minutes for a complete 20–30 page book. Each page renders in roughly 8 seconds, and you can regenerate any outlier in a single click without redoing the rest.",
  },
  {
    q: "Do I need design or AI prompting experience?",
    a:
      "No. You only describe what you want in plain English. Sparky AI (the built-in chat assistant) handles all the prompt engineering, character locking and style consistency for you.",
  },
  {
    q: "Are activity books available yet?",
    a:
      "Activity books (mazes, dot-to-dot, word search and mixed puzzle pages) are coming soon as the third book type alongside story books and coloring books. Join the free tier to be notified when they launch.",
  },
  {
    q: "Can I make a return-gift book for a birthday party?",
    a:
      "Yes — many parents use CrayonSparks to make a small printable book each child takes home from a birthday party. Print and bind a stack of identical books, or personalize each one with the child's name on the cover.",
  },
]);

const softwareSchema = buildSoftwareApplication([
  {
    name: "Free",
    price: "0",
    description: "50 starter credits — try story books and coloring books risk-free.",
  },
  {
    name: "Hobbyist",
    price: "19",
    description: "800 credits/month. Best for parents making one-of-a-kind kids' books and small-batch KDP creators.",
  },
  {
    name: "Pro",
    price: "49",
    description: "3500 credits/month. Best for full-time KDP creators publishing weekly.",
  },
]);

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <Navbar />

      {/* HERO */}
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

      {/* FEATURES BENTO */}
      <section className="relative py-24 bg-linear-to-b from-black via-violet-950/20 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              Everything you need to ship a coloring book
            </h2>
            <p className="mt-4 text-neutral-400 max-w-2xl mx-auto">
              From prompt to published, automated end-to-end. Idea → image → KDP
              PDF → Pinterest → sale.
            </p>
          </div>

          <BentoGrid className="max-w-5xl mx-auto">
            <BentoGridItem
              className="md:col-span-2 bg-linear-to-br from-violet-900/30 to-indigo-900/20 border-violet-500/20"
              header={
                <BentoHeader
                  image={visualUrl("visuals/bento/themes.png")}
                  gradient="bg-linear-to-br from-violet-600/25 via-indigo-600/20 to-cyan-500/15"
                  fallback={
                    <div className="flex gap-3">
                      {["🐄", "🦁", "🐬", "🦋", "🦖"].map((e, i) => (
                        <div
                          key={i}
                          className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl shadow-lg backdrop-blur"
                          style={{
                            transform: `translateY(${i % 2 === 0 ? 0 : -10}px)`,
                          }}
                        >
                          {e}
                        </div>
                      ))}
                    </div>
                  }
                />
              }
              icon={<Palette className="h-5 w-5 text-violet-400" />}
              title="14 ready-to-publish themes"
              description="From farm animals to unicorns — each theme comes with 20 kid-friendly prompts, an SEO-ready KDP title, 7 backend keywords, and cover art direction."
            />
            <BentoGridItem
              header={
                <BentoHeader
                  image={visualUrl("visuals/bento/nano-banana.png")}
                  gradient="bg-linear-to-br from-indigo-600/20 to-violet-600/20"
                  fallback={<Zap className="w-16 h-16 text-indigo-300" />}
                />
              }
              icon={<Zap className="h-5 w-5 text-indigo-300" />}
              title="Gemini Nano Banana"
              description="Cheapest & fastest image model for clean line art. ~8s per page, high consistency across a book."
            />
            <BentoGridItem
              header={
                <BentoHeader
                  image={visualUrl("visuals/bento/kdp-ready.png")}
                  gradient="bg-linear-to-br from-cyan-600/20 to-blue-600/20"
                  fallback={<BookOpen className="w-16 h-16 text-cyan-300" />}
                />
              }
              icon={<BookOpen className="h-5 w-5 text-cyan-300" />}
              title="KDP-ready output"
              description="8.5×11&quot; interior PDF, 300 DPI, single-sided layout, proper margins & gutter. Cover + metadata bundle."
            />
            <BentoGridItem
              className="md:col-span-2 bg-linear-to-br from-rose-900/25 to-violet-900/20 border-rose-500/20"
              badge="Coming Soon"
              header={
                <BentoHeader
                  image={visualUrl("visuals/bento/pinterest.png")}
                  gradient="bg-linear-to-br from-rose-600/20 to-violet-600/20"
                  fallback={<Pin className="w-20 h-20 text-rose-300" />}
                />
              }
              icon={<Pin className="h-5 w-5 text-rose-300" />}
              title="Pinterest sales engine"
              description="Auto-generate 10 pin variants per book, schedule across 30 days, UTM-tag links to Amazon/Etsy. Pinterest has 2-year pin lifespan vs. 24hr Instagram."
            />
            <BentoGridItem
              badge="Coming Soon"
              header={
                <BentoHeader
                  image={visualUrl("visuals/bento/marketplace.png")}
                  gradient="bg-linear-to-br from-emerald-600/20 to-cyan-600/20"
                  fallback={<ShoppingCart className="w-16 h-16 text-emerald-300" />}
                />
              }
              icon={<ShoppingCart className="h-5 w-5 text-emerald-300" />}
              title="Multi-marketplace"
              description="One-click publish to Amazon KDP, Etsy Digital, and Gumroad — same source, three revenue streams."
            />
            <BentoGridItem
              badge="Coming Soon"
              header={
                <BentoHeader
                  image={visualUrl("visuals/bento/sales-attribution.png")}
                  gradient="bg-linear-to-br from-violet-600/20 to-indigo-600/20"
                  fallback={<TrendingUp className="w-16 h-16 text-violet-300" />}
                />
              }
              icon={<TrendingUp className="h-5 w-5 text-violet-300" />}
              title="Sales attribution"
              description="Track which pin drove which sale. Scale winners, kill losers. Real data, not guesswork."
            />
            <BentoGridItem
              header={
                <BentoHeader
                  image={visualUrl("visuals/bento/batch-20.png")}
                  gradient="bg-linear-to-br from-sky-600/20 to-indigo-600/20"
                  fallback={<Layers className="w-16 h-16 text-sky-300" />}
                />
              }
              icon={<Layers className="h-5 w-5 text-sky-300" />}
              title="Batch of 20"
              description="Run a full 20-page book in parallel. Go from niche pick to KDP-ready folder in under 5 minutes."
            />
          </BentoGrid>
        </div>
      </section>

      {/* REAL BOOKS — TRUST */}
      {/* REAL BOOKS — TRUST (toggle: drag / carousel) */}
      <BooksShowcase />

      {/* HOW IT WORKS */}
      <section className="relative py-24 bg-linear-to-b from-violet-950/20 to-black overflow-hidden">
        <BackgroundBeams className="!bg-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              Idea to Amazon in 4 steps
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                num: "01",
                title: "Pick a theme",
                desc: "Farm animals, dinosaurs, unicorns — or your own niche.",
                icon: <Palette className="w-6 h-6" />,
              },
              {
                num: "02",
                title: "Generate 20 pages",
                desc: "Gemini Nano Banana produces consistent line art in ~3 min.",
                icon: <Sparkles className="w-6 h-6" />,
              },
              {
                num: "03",
                title: "Download PDF",
                desc: "8.5×11&quot; KDP-ready interior. Cover + metadata included.",
                icon: <ImageIcon className="w-6 h-6" />,
              },
              {
                num: "04",
                title: "Publish & promote",
                desc: "Upload to KDP. Auto-schedule Pinterest pins. Track sales.",
                icon: <TrendingUp className="w-6 h-6" />,
              },
            ].map((s, i) => (
              <div
                key={i}
                className="relative p-6 rounded-2xl bg-linear-to-br from-white/[0.06] to-white/[0.02] border border-white/10 overflow-hidden backdrop-blur-sm"
              >
                <div className="text-xs font-mono font-bold gradient-text mb-3">{s.num}</div>
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-600/30 to-cyan-600/30 flex items-center justify-center text-violet-300 mb-4">
                  {s.icon}
                </div>
                <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-neutral-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative py-20 bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Built by creators, for creators
            </h2>
            <p className="mt-3 text-neutral-400">
              Early feedback from KDP sellers, parents, and teachers
            </p>
          </div>
          <InfiniteMovingCards
            items={[
              {
                quote:
                  "I made 5 books in a weekend. The prompt library alone saved me 20 hours of brainstorming.",
                name: "Priya S.",
                title: "KDP seller · 8 titles live",
              },
              {
                quote:
                  "My kids love the farm animals book. The lines are thick enough for a 4-year-old — rare for AI output.",
                name: "Marcus J.",
                title: "Homeschool parent",
              },
              {
                quote:
                  "Finally an AI tool built with KDP specs in mind. 8.5×11 PDFs export perfectly.",
                name: "Anita R.",
                title: "Self-publisher",
              },
              {
                quote:
                  "The Pinterest auto-pilot is the killer feature. Set it once, pins roll out for 30 days.",
                name: "Dev K.",
                title: "Etsy digital store",
              },
              {
                quote:
                  "Used the ABC pack with my preschool class. Kids were thrilled. Teachers need this.",
                name: "Sarah M.",
                title: "Preschool teacher",
              },
            ]}
            direction="left"
            speed="slow"
          />
        </div>
      </section>

      {/* FINAL CTA — Spotlight + product preview backdrop */}
      <section className="relative py-28 bg-black overflow-hidden">
        <Spotlight
          className="-top-20 left-1/2 -translate-x-1/2"
          fill="#8b5cf6"
        />
        <div className="absolute inset-0 grid-pattern opacity-15 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,black_75%)] pointer-events-none" />

        {/* Faded sample-image grid behind the content */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center gap-3 md:gap-5 opacity-30 mix-blend-screen pointer-events-none px-4">
          {[
            "/visuals/covers/farm-animals.png",
            "/visuals/covers/dinosaurs.png",
            "/visuals/covers/woodland-baby-animals.png",
            "/visuals/covers/happy-farm-animals.jpg",
            "/visuals/covers/wild-animals.png",
          ].map((src, i) => (
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
              href="/playground"
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

      <Footer />
    </>
  );
}
