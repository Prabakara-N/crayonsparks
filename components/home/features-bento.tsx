import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { visualUrl } from "@/lib/visuals";
import { BentoHeader } from "@/components/home/bento-header";
import {
  Layers,
  Zap,
  BookOpen,
  Pin,
  TrendingUp,
  ShoppingCart,
  Palette,
} from "lucide-react";

export function FeaturesBento() {
  return (
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
  );
}
