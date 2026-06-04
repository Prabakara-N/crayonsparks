import { BackgroundBeams } from "@/components/ui/background-beams";
import { PenLine, Palette, BookOpen, Download } from "lucide-react";

const STEPS = [
  {
    num: "01",
    title: "Describe your idea",
    desc: "Tell us your theme and audience, and the kind of book you want to create.",
    icon: <PenLine className="w-6 h-6" />,
  },
  {
    num: "02",
    title: "Choose your style",
    desc: "Pick coloring, activity, or story — and the look that fits your book.",
    icon: <Palette className="w-6 h-6" />,
  },
  {
    num: "03",
    title: "AI creates your book",
    desc: "Our AI generates a unique book with beautiful, consistent art in minutes.",
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    num: "04",
    title: "Download & publish",
    desc: "Get your KDP-ready PDF, perfect for printing or selling on Amazon.",
    icon: <Download className="w-6 h-6" />,
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 bg-linear-to-b from-violet-950/20 to-black overflow-hidden">
      <BackgroundBeams className="!bg-transparent" />
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Idea to Amazon in 4 steps
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div
              key={s.num}
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
  );
}
