import Link from "next/link";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Sparkles, Zap, Rocket, ShieldCheck, Globe, Repeat } from "lucide-react";
import { FaqAccordion } from "@/components/pricing/faq-accordion";
import { TierGrid } from "@/components/pricing/tier-grid";
import { CreditExplainer } from "@/components/pricing/credit-explainer";
import { TopupPacks } from "@/components/pricing/topup-packs";
import { CheckoutProvider } from "@/components/pricing/checkout-provider";
import type { TierCardData } from "@/components/pricing/tier-card";
import { buildFaqPage } from "@/lib/seo-schema";

export const metadata = {
  title: "Pricing — CrayonSparks",
  description:
    "Credit-based pricing for AI coloring and story books. Free tier with 50 credits, Hobbyist $19/mo, Pro $49/mo. Cancel anytime, 30-day refund.",
};

const TIERS: ReadonlyArray<TierCardData> = [
  {
    name: "Free",
    monthlyPrice: 0,
    icon: <Sparkles className="w-5 h-5" />,
    blurb: "Make one full book end-to-end, on us.",
    creditAllocation: "50 credits — one-time",
    features: [
      { text: "Generate 1 sample book" },
      { text: "Flash (fast) image models" },
      { text: "Watermarked PDF + PNG" },
      { text: "1 book in your library" },
      { text: "Personal use only" },
    ],
    cta: { label: "Start free", href: "/playground" },
  },
  {
    name: "Hobbyist",
    monthlyPrice: 19,
    annualPrice: 180,
    icon: <Zap className="w-5 h-5" />,
    blurb: "For creators publishing a few books a month.",
    creditAllocation: "800 credits / month",
    features: [
      { text: "~4-5 coloring books per month", bold: true },
      { text: "No watermark" },
      { text: "KDP commercial license" },
      { text: "All Flash models" },
      { text: "Etsy A4 + KDP Letter PDFs" },
      { text: "Credits roll over (up to 1,500)" },
      { text: "Email support" },
    ],
    cta: { label: "Choose Hobbyist", href: "#" },
    planId: "hobbyist",
    highlight: true,
    badge: "Most popular",
  },
  {
    name: "Pro",
    monthlyPrice: 49,
    annualPrice: 468,
    icon: <Rocket className="w-5 h-5" />,
    blurb: "For active KDP sellers shipping every week.",
    creditAllocation: "3,500 credits / month",
    features: [
      { text: "~12-15 story books per month", bold: true },
      { text: "Pro models (Gemini 3 Pro, GPT Image 1.5)", bold: true },
      { text: "Priority generation queue" },
      { text: "All output formats" },
      { text: "KDP + Etsy + Gumroad license" },
      { text: "Credits roll over (up to 6,000)" },
      { text: "Faster support response" },
    ],
    cta: { label: "Choose Pro", href: "#" },
    planId: "pro",
  },
];

const FAQS = [
  {
    q: "How do credits work?",
    a: "Each action — generating a page, refining an image — has a small credit cost shown right on the button before you click. Your subscription gives you a monthly credit allowance. Unused credits roll over (up to a cap). Sparky AI planning, PDF assembly, and our own quality-gate auto-regens cost zero credits — you only pay for the deliverable.",
  },
  {
    q: "What happens if I run out mid-book?",
    a: "We reserve credits for the WHOLE book before generation starts, so the bulk-generate flow can't strand you halfway through. If your balance won't cover the book, you'll see the shortfall up front with one-click top-up or upgrade options.",
  },
  {
    q: "Do credits expire?",
    a: "Subscription credits roll over each month up to a generous cap (1,500 on Hobbyist, 6,000 on Pro) — quiet months don't punish you. Top-up credits stay valid for 12 months from purchase and are consumed only after your monthly subscription credits run out.",
  },
  {
    q: "Why not Stripe?",
    a: "We use Lemon Squeezy as our Merchant of Record — they handle global VAT, GST, and US sales tax automatically across every country. It's a smoother experience for international buyers and removes a huge compliance burden on our end as an India-based team serving worldwide creators.",
  },
  {
    q: "Do I own the books I create?",
    a: "Yes. Every paid plan includes a commercial license — sell on Amazon KDP, Etsy, Gumroad, your own site, or print at home. The Free tier is personal use only and outputs a watermarked preview.",
  },
  {
    q: "Can I switch tiers later?",
    a: "Anytime. Upgrade and the new credit allowance is prorated for the rest of the cycle. Downgrade and you keep your current credits + tier benefits through the period you've paid for; the downgrade takes effect at renewal.",
  },
  {
    q: "Cancellation and refunds?",
    a: "Cancel anytime from the billing portal — no contracts, no calls. You keep access through your paid period. We honor a 30-day no-questions-asked refund on your most recent monthly payment, and prorated refunds on unused annual months if you cancel within the first 30 days of an annual subscription.",
  },
  {
    q: "Why is Pro $49? Competitors charge less.",
    a: "Pro unlocks our highest-quality painterly models (Gemini 3 Pro, GPT Image 1.5) — about 3x the API cost of our Flash models. Most Pro subscribers earn their $49 back from a single KDP listing in their first month. If Flash quality is enough for your style, the Hobbyist plan is a great fit at $19.",
  },
];

const faqSchema = buildFaqPage(FAQS.map((f) => ({ q: f.q, a: f.a })));

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <main className="flex-1 pt-28 pb-20 bg-linear-to-b from-black via-violet-950/15 to-black text-white">
        <CheckoutProvider returnTo="/pricing">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Hero />
          <div className="mt-12">
            <TierGrid tiers={TIERS} />
          </div>
          <TrustRow />
          <section className="mt-20 space-y-6">
            <CreditExplainer />
            <TopupPacks />
          </section>
          <WhySection />
          <section className="mt-24 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3">
              Common questions
            </h2>
            <p className="text-center text-neutral-400 mb-10">
              Still unsure?{" "}
              <Link
                href="mailto:crayonsparksai@gmail.com"
                className="text-violet-300 hover:text-violet-200 underline-offset-4 hover:underline"
              >
                Email us
              </Link>{" "}
              and we&apos;ll answer in a day.
            </p>
            <FaqAccordion faqs={FAQS} />
          </section>
        </section>
        </CheckoutProvider>
      </main>
      <Footer />
    </>
  );
}

function Hero() {
  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-linear-to-r from-violet-500/15 to-cyan-500/15 border border-violet-500/30 text-xs font-medium text-violet-200 mb-5">
        Credit-based · Cancel anytime · 30-day refund
      </div>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        Pricing made for{" "}
        <span className="gradient-text">KDP creators</span>
      </h1>
      <p className="mt-5 text-neutral-300 max-w-2xl mx-auto leading-relaxed">
        Pay for what you make, not for time. Start with 50 free credits — enough
        for a full sample book. Upgrade when you&apos;re ready to ship to KDP.
      </p>
    </div>
  );
}

function TrustRow() {
  const items: ReadonlyArray<{ icon: React.ReactNode; label: string }> = [
    {
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      label: "30-day refund on every plan",
    },
    {
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      label: "Pay in USD via Lemon Squeezy — VAT/GST handled",
    },
    {
      icon: <Repeat className="w-4 h-4 text-violet-400" />,
      label: "Credits roll over month to month",
    },
  ];
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-neutral-400">
      {items.map((it) => (
        <div key={it.label} className="inline-flex items-center gap-2">
          {it.icon}
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function WhySection() {
  return (
    <section className="mt-20 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold">Why credits + subscription?</h2>
        <p className="text-neutral-400 mt-2 max-w-xl mx-auto">
          Most AI tools force you to choose: predictable monthly bill, or
          pay-per-use anxiety. We give you both.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <WhyCard
          title="Predictable bill"
          body="Your monthly subscription is set in stone — no surprise charges, no end-of-month invoices."
        />
        <WhyCard
          title="No click anxiety"
          body="Credits inside your plan mean you've already paid for the work. Every Generate click costs you nothing extra."
        />
        <WhyCard
          title="Heavy users scale honestly"
          body="If you outgrow your plan, top-up packs are cheaper than upgrading. Power users pay more without forcing everyone else to."
        />
      </div>
    </section>
  );
}

function WhyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl p-5 bg-zinc-900/60 border border-white/10">
      <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-neutral-400 leading-relaxed">{body}</p>
    </div>
  );
}
