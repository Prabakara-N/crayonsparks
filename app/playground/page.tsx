import { Suspense } from "react";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Spotlight } from "@/components/ui/spotlight";
import { PlaygroundShell } from "@/components/playground/playground-shell";

export const metadata = {
  title: "Playground — CrayonSparks",
  description:
    "Free-form image generator and AI-guided book planner. Generate a single image with Gemini, or chat to plan a complete coloring book.",
};

export default function PlaygroundPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-28 pb-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0 -top-28 overflow-hidden pointer-events-none">
          <Spotlight className="-top-20 left-20" fill="#8b5cf6" />
          <div className="absolute inset-0 grid-pattern opacity-25" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,black_80%)]" />
        </div>

        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="h-32" />}>
            <PlaygroundShell />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
