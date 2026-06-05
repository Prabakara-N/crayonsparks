import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Spotlight } from "@/components/ui/spotlight";
import { SparkyMain } from "@/components/sparky/sparky-main";
import { buildFaqPage, buildBreadcrumb } from "@/lib/seo-schema";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Sparky AI — Plan a Kid's Book in Minutes",
  description:
    "Chat with Sparky AI to plan a complete kids' book — coloring books, story books or activity books. Answer a few questions and Sparky builds a print-ready, KDP-ready plan you can generate instantly.",
  alternates: { canonical: "/sparky-ai" },
  openGraph: {
    title: "Sparky AI — Plan a Kid's Book in Minutes · CrayonSparks",
    description:
      "Chat to plan coloring books, story books and activity books. Sparky asks a few questions and builds a complete, print-ready book plan.",
    type: "website",
    url: "/sparky-ai",
  },
};

const faqSchema = buildFaqPage([
  {
    q: "What is Sparky AI?",
    a: "Sparky AI is the planning assistant inside CrayonSparks. You tell it what kind of kids' book you want — coloring book, story book, or activity book — and it asks a few quick questions, then builds a complete, print-ready book plan you can generate and download as a KDP-ready PDF.",
  },
  {
    q: "Which kinds of books can Sparky AI plan?",
    a: "All three CrayonSparks book types: coloring books (B&W line art, one subject per page), story books (full-color picture stories with characters and speech bubbles), and activity books (mazes, dot-to-dot, word search, letter and number tracing, counting, color-by-number, spot-the-difference and more).",
  },
  {
    q: "Do I need prompting or design experience to use Sparky AI?",
    a: "No. You only answer plain-English questions. Sparky handles the prompt engineering, character consistency, page planning, and KDP layout for you, then hands the finished plan to the studio to generate every page.",
  },
]);

const breadcrumbSchema = buildBreadcrumb([
  { name: "Home", path: "/" },
  { name: "Sparky AI", path: "/sparky-ai" },
]);

export default function SparkyAiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Navbar />
      <main className="flex-1 pt-28 pb-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0 -top-28 overflow-hidden pointer-events-none">
          <Spotlight className="-top-20 left-20" fill="#8b5cf6" />
          <div className="absolute inset-0 grid-pattern opacity-25" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,black_80%)]" />
        </div>

        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-linear-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 text-xs font-medium text-violet-300 mb-5 backdrop-blur">
              <Sparkles className="w-3 h-3" />
              Sparky AI · Coloring · Story · Activity
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white">
              Plan a kid&apos;s book with{" "}
              <span className="gradient-text">Sparky AI</span>
            </h1>
            <p className="mt-4 text-neutral-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Coloring, story, or activity book — answer a few quick questions
              and get a complete, print-ready plan you can generate right here.
            </p>
          </div>

          <Suspense fallback={<div className="h-32" />}>
            <SparkyMain />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
