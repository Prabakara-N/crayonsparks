import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Spotlight } from "@/components/ui/spotlight";
import { CoverStudio } from "@/components/playground/playground-studio/cover/cover-studio";

export const metadata = {
  title: "Book cover maker — CrayonSparks",
  description:
    "Generate a front cover, design a back cover, and download a print-ready KDP wraparound PDF (back + spine + front).",
};

export default function CoverStudioPage() {
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
          <CoverStudio />
        </section>
      </main>
      <Footer />
    </>
  );
}
