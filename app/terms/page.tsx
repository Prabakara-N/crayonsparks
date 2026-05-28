import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import {
  CheckCircle2,
  FileText,
  UserCog,
  Image as ImageIcon,
  Ban,
  CreditCard,
  RefreshCcw,
  ShieldAlert,
  Scale,
  AlertTriangle,
  Gavel,
  Mail,
} from "lucide-react";

export const metadata = {
  title: "Terms of Service",
  description:
    "The agreement that governs your use of CrayonSparks.",
};

interface Section {
  icon: React.ReactNode;
  title: string;
  body?: string;
  list?: string[];
}

const EFFECTIVE_DATE = "May 25, 2026";

const SECTIONS: Section[] = [
  {
    icon: <CheckCircle2 className="w-5 h-5" />,
    title: "Agreement to terms",
    body: "These Terms of Service (\"Terms\") form a binding contract between you and CrayonSparks (\"CrayonSparks\", \"we\", \"us\", \"our\") and govern your access to and use of crayonsparks.com and the related apps, APIs, and services (collectively, the \"Service\"). By creating an account, signing in, or otherwise using the Service, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, you must not use the Service.",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "The Service",
    body: "CrayonSparks is an AI-assisted creative tool that helps you generate, refine, organise, and export children's coloring books and story books, and prepare them for personal use, gifting, and commercial publishing on third-party marketplaces (such as Amazon KDP, Etsy, Gumroad, and Pinterest). The Service is offered on a credit-based model with both free trials and paid subscriptions. Features, pricing, and credit costs may change at any time; we will provide reasonable notice of material changes that affect paid plans.",
  },
  {
    icon: <UserCog className="w-5 h-5" />,
    title: "Eligibility and accounts",
    list: [
      "You must be at least 18 years old (or the age of majority in your jurisdiction) to create an account. If you act on behalf of a business, you confirm you are authorised to bind that business to these Terms.",
      "You are responsible for keeping your sign-in credentials and any connected third-party tokens (Etsy, Pinterest, Gumroad, etc.) secure. Notify us immediately at crayonsparksai@gmail.com if you suspect unauthorised access.",
      "One person may not maintain multiple accounts to circumvent free-tier limits or evade enforcement actions. We may suspend or merge duplicate accounts.",
      "You are responsible for all activity that occurs under your account.",
    ],
  },
  {
    icon: <ImageIcon className="w-5 h-5" />,
    title: "Your content and ownership",
    list: [
      "**Your input.** You retain all rights you have in the prompts, briefs, reference images, and other content you provide to the Service (\"Input\").",
      "**Your output.** As between you and CrayonSparks, you own the images, books, metadata, and other artifacts the Service generates from your Input (\"Output\"), subject to the underlying terms of the AI providers we use (currently Google Gemini and OpenAI) and to compliance with these Terms. You are free to publish, sell, gift, and otherwise commercially exploit your Output, including via Amazon KDP, Etsy, Gumroad, and similar platforms.",
      "**Licence to us.** You grant CrayonSparks a limited, worldwide, royalty-free licence to host, process, transmit, display, and modify your Input and Output strictly to provide, secure, and improve the Service for you (for example, generating image variants, building PDF/ZIP downloads, and rendering previews). This licence ends when you delete the relevant content.",
      "**No training.** We do not use your Input or Output to train any AI model, and we contractually require our AI sub-processors not to use your data to train their models where such an option exists.",
      "**Uniqueness disclaimer.** Generative AI may produce similar outputs for different users from similar inputs. You acknowledge that CrayonSparks cannot guarantee the uniqueness or originality of any Output, and that you remain responsible for any due diligence necessary before commercial publication.",
    ],
  },
  {
    icon: <Ban className="w-5 h-5" />,
    title: "Acceptable use",
    body: "You agree not to use the Service to create, store, publish, or distribute content that:",
    list: [
      "Sexualises, exploits, or endangers minors in any way (CSAM is reported to the appropriate authorities).",
      "Depicts non-consensual sexual content, gratuitous violence, hate speech, or harassment.",
      "Targets real people without their consent, including likeness, voice, or personal identifiers.",
      "Infringes intellectual-property rights — including copyrighted characters (Disney, Pixar, Marvel, Pokémon, etc.), trademarks, or branded logos — or violates publicity rights.",
      "Misrepresents the Output as anything other than AI-assisted when required by platform rules (e.g. KDP, Etsy disclosure requirements).",
      "Violates applicable laws (export controls, sanctions, consumer-protection laws, advertising standards).",
      "Attempts to disable, overload, reverse-engineer, scrape, or circumvent the Service's security, rate limits, or credit system.",
      "Resells or sublicenses the Service itself (as opposed to your generated Output) without our written agreement.",
    ],
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Credits, plans, and payments",
    list: [
      "Generation, refinement, and publishing actions consume credits at the rates displayed in the app. Rates may be adjusted; we will give notice before a price increase for active subscribers.",
      "Paid plans are billed by Lemon Squeezy (Squeeze Inc.), the merchant of record. Lemon Squeezy handles invoicing, payment processing, tax collection, and remittance.",
      "Subscriptions renew automatically until cancelled. You can cancel at any time from your account or via the Lemon Squeezy customer portal; cancellation takes effect at the end of the current billing period.",
      "Credits do not expire while your account is active. Unused credits are not refundable and have no cash value.",
      "Taxes (VAT, GST, sales tax) are calculated by Lemon Squeezy at checkout based on your billing country.",
    ],
  },
  {
    icon: <RefreshCcw className="w-5 h-5" />,
    title: "Refunds",
    body: "We want you to be satisfied. If a paid plan does not meet your expectations, contact crayonsparksai@gmail.com within 14 days of purchase for a full refund of that billing cycle, provided you have used less than 25% of the credits in that cycle. Add-on credit packs are non-refundable once any credits in the pack have been consumed. Refunds for chargebacks or disputed transactions are subject to Lemon Squeezy's policies.",
  },
  {
    icon: <ShieldAlert className="w-5 h-5" />,
    title: "Third-party services and integrations",
    body: "When you connect Etsy, Pinterest, Gumroad, or other third-party services to the Service, you authorise CrayonSparks to act on your behalf for the actions you initiate (such as publishing a book or scheduling a pin). Those third-party services have their own terms and privacy policies, and your relationship with them is independent of your relationship with us. We are not responsible for outages, data loss, or policy changes on those services.",
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "Service availability",
    body: "We work hard to keep the Service available, but we provide it on an \"as is\" and \"as available\" basis. The Service depends on third-party providers (Google Cloud, Vercel, Gemini, OpenAI, Lemon Squeezy, marketplace APIs) whose outages may affect availability. We may schedule maintenance, throttle requests, or roll back changes that risk reliability without prior notice. We are not liable for temporary outages, lost work caused by AI-provider failures, or third-party-marketplace rejections of your Output.",
  },
  {
    icon: <Scale className="w-5 h-5" />,
    title: "Disclaimer of warranties",
    body: "To the maximum extent permitted by law, CrayonSparks disclaims all warranties, express or implied, including merchantability, fitness for a particular purpose, non-infringement, and any warranty arising from course of dealing or usage of trade. The Service and all Output are provided without any guarantee of quality, accuracy, suitability for publication, or commercial viability. You are solely responsible for reviewing Output before using or publishing it.",
  },
  {
    icon: <Gavel className="w-5 h-5" />,
    title: "Limitation of liability",
    body: "To the maximum extent permitted by law, in no event will CrayonSparks, its founders, officers, employees, or affiliates be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for any loss of profits, revenue, business opportunity, goodwill, or data, arising out of or in connection with your use of the Service, even if we have been advised of the possibility of such damages. Our total aggregate liability for any claim arising out of or relating to these Terms or the Service will not exceed the greater of (a) the amount you paid us in the twelve months immediately preceding the claim, or (b) US $50.",
  },
  {
    icon: <ShieldAlert className="w-5 h-5" />,
    title: "Indemnification",
    body: "You agree to defend, indemnify, and hold harmless CrayonSparks from and against any third-party claim, demand, loss, liability, damage, cost, or expense (including reasonable legal fees) arising out of (a) your Input or Output, (b) your violation of these Terms or any applicable law, (c) your violation of any third-party right (including IP rights), or (d) your publication or sale of Output on third-party marketplaces.",
  },
  {
    icon: <UserCog className="w-5 h-5" />,
    title: "Suspension and termination",
    body: "We may suspend, restrict, or terminate your access to the Service at any time and without notice if we reasonably believe you have violated these Terms, presented a security or fraud risk, or are required to do so by law. You may terminate your account at any time from the account settings. Termination ends your right to use the Service; provisions of these Terms that by their nature should survive (ownership, disclaimers, limitations of liability, indemnification, governing law) will survive termination.",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Changes to these Terms",
    body: "We may revise these Terms from time to time. We will post the updated Terms on this page and update the \"Effective date\" above. If the changes are material we will give at least 14 days' notice by email or a prominent in-app notice before they take effect. Continued use of the Service after the effective date constitutes acceptance of the revised Terms.",
  },
  {
    icon: <Gavel className="w-5 h-5" />,
    title: "Governing law and disputes",
    body: "These Terms are governed by the laws of India, without regard to conflict-of-law principles. Subject to mandatory consumer-protection laws in your country of residence, you and CrayonSparks agree that the courts located in Chennai, Tamil Nadu, India have exclusive jurisdiction to resolve any dispute arising out of or relating to these Terms or the Service, and we both consent to the personal jurisdiction of those courts.",
  },
  {
    icon: <Mail className="w-5 h-5" />,
    title: "Contact",
    body: "Questions about these Terms? Email crayonsparksai@gmail.com.",
  },
];

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="text-white font-semibold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-28 pb-20 bg-black">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-linear-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 text-xs font-medium text-violet-300 mb-5 backdrop-blur">
              Legal
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white">
              Terms of <span className="gradient-text">Service</span>
            </h1>
            <p className="mt-4 text-neutral-400">
              Effective date: {EFFECTIVE_DATE}
            </p>
          </div>

          <div className="space-y-4">
            {SECTIONS.map((s, i) => (
              <section
                key={s.title}
                className="group relative rounded-2xl p-6 md:p-7 bg-zinc-900/60 backdrop-blur-xl border border-white/10 hover:border-violet-500/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-linear-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[11px] font-mono text-neutral-500">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h2 className="font-display text-xl md:text-2xl font-semibold text-white tracking-tight">
                        {s.title}
                      </h2>
                    </div>
                    {s.body && (
                      <p className="text-neutral-300 leading-relaxed mb-3">
                        {s.body}
                      </p>
                    )}
                    {s.list && (
                      <ul className="space-y-2">
                        {s.list.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-neutral-300 leading-relaxed"
                          >
                            <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0 bg-violet-400" />
                            <span>{renderInline(item)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 text-center text-sm text-neutral-500">
            CrayonSparks · crayonsparksai@gmail.com ·{" "}
            <a
              href="/contact"
              className="text-violet-300 hover:text-violet-200 font-medium"
            >
              Contact us
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
