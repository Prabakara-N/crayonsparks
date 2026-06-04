import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { BooksShowcase } from "@/components/home/books-showcase";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesBento } from "@/components/home/features-bento";
import { HowItWorks } from "@/components/home/how-it-works";
import { Testimonials } from "@/components/home/testimonials";
import { FinalCta } from "@/components/home/final-cta";
import { buildSoftwareApplication, buildFaqPage } from "@/lib/seo-schema";

const faqSchema = buildFaqPage([
  {
    q: "What is CrayonSparks?",
    a:
      "CrayonSparks is an AI book studio that turns any idea into a finished kids' book in minutes. You can make story books (full-color picture books with dialogue), coloring books (B&W line art) and activity books (mazes, dot-to-dot, word search, letter & number tracing, counting, color-by-number and more). Use it to self-publish on Amazon KDP, or print one-of-a-kind books for birthdays, return gifts and memory keepsakes.",
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
    q: "What kinds of activity books can I make?",
    a:
      "Activity books are live as the third book type alongside story books and coloring books. Generate mazes, dot-to-dot, word search, crosswords, letter and number tracing, counting, matching, sorting, patterns, color-by-number, seek-and-find and spot-the-difference pages. Let CrayonSparks auto-mix the page types for the age you choose, or pick the exact count of each. Tracing and worksheet pages are rendered as crisp print-ready vector pages, and the whole book exports as a KDP-ready 8.5×11 PDF.",
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
    description: "50 starter credits — try story books, coloring books and activity books risk-free.",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <HeroSection />
      <FeaturesBento />
      <BooksShowcase />
      <HowItWorks />
      <Testimonials />
      <FinalCta />
      <Footer />
    </>
  );
}
