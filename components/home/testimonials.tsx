import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

const TESTIMONIALS = [
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
];

export function Testimonials() {
  return (
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
        <InfiniteMovingCards items={TESTIMONIALS} direction="left" speed="slow" />
      </div>
    </section>
  );
}
