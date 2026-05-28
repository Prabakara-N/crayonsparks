import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import {
  Database,
  ShieldCheck,
  ExternalLink,
  UserCheck,
  Cookie,
  Mail,
  Lock,
  Globe,
  Clock,
  Baby,
  AlertTriangle,
  Workflow,
} from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How CrayonSparks collects, uses, and protects your personal data.",
};

interface Section {
  icon: React.ReactNode;
  title: string;
  body?: string;
  list?: string[];
  kind?: "collects" | "not-collects" | "info";
}

const EFFECTIVE_DATE = "May 25, 2026";

const SECTIONS: Section[] = [
  {
    icon: <Workflow className="w-5 h-5" />,
    title: "Introduction",
    body: "CrayonSparks (\"CrayonSparks\", \"we\", \"us\", or \"our\") operates crayonsparks.com (the \"Service\"), an AI-assisted tool that helps creators generate, refine, and prepare children's coloring books and story books for personal use, gifting, and commercial publishing on platforms such as Amazon KDP, Etsy, Gumroad, Pinterest, and similar marketplaces. This Privacy Policy explains what information we collect, how we use and protect it, who we share it with, and the choices and rights you have under applicable law, including the EU/UK General Data Protection Regulation (GDPR), India's Digital Personal Data Protection Act 2023 (DPDP), and the California Consumer Privacy Act (CCPA/CPRA). By creating an account or otherwise using the Service, you agree to the practices described here.",
  },
  {
    icon: <Database className="w-5 h-5" />,
    title: "Information we collect",
    kind: "collects",
    body: "We collect only the information needed to operate, secure, and improve the Service.",
    list: [
      "**Account information.** When you sign in (via Google or another supported identity provider), we receive your name, email address, profile picture URL, and unique provider identifier. We do not see or store your social-account password.",
      "**Books and generated content.** Prompts you submit, generated images, metadata you enter (titles, descriptions, KDP categories, keywords), and saved drafts are stored against your account so you can return to them later.",
      "**Billing information.** Plan, credit balance, transaction identifiers, and tax country. Card details are handled exclusively by Lemon Squeezy, our merchant of record, and never reach our servers.",
      "**Integration tokens.** When you connect Etsy, Pinterest, Gumroad, or similar third-party marketplaces, we store OAuth refresh tokens encrypted at rest so the Service can publish on your behalf. You can disconnect any integration at any time from your account.",
      "**Operational data.** Sign-in timestamps, IP address (used for rate limiting and abuse detection), browser user-agent, device locale, and feature-usage events. We use this data to keep the Service reliable and to investigate fraud or abuse.",
      "**Diagnostics.** Error reports and stack traces sent to Sentry when something fails. We scrub these payloads so they do not include your prompts, generated images, or personal identifiers beyond a hashed user reference.",
      "**Support communications.** Messages you send through our contact form, the in-app feedback widget, or email, including any attachments you choose to provide.",
    ],
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "What we do not collect",
    kind: "not-collects",
    list: [
      "We do not sell your personal data.",
      "We do not use your prompts, uploads, or generated images to train any AI model — ours or anyone else's.",
      "We do not run third-party advertising trackers, fingerprinting scripts, or social-media pixels.",
      "We do not knowingly collect data from children under 13 (or under 16 in jurisdictions where that is the digital-age threshold). The Service is intended for parents, educators, and professional creators who design content for children.",
    ],
  },
  {
    icon: <Workflow className="w-5 h-5" />,
    title: "How we use your information",
    body: "We process your data on the legal bases described in the Legal Bases section below for the following purposes:",
    list: [
      "Provide the core Service — authenticate you, generate and store your books, deliver downloads, and process publish-to-marketplace requests.",
      "Manage billing, credits, and refunds.",
      "Send transactional emails (sign-in confirmations, receipts, important account notices).",
      "Detect, investigate, and prevent abuse, fraud, harmful content, and violations of our Terms.",
      "Improve the Service through aggregated, de-identified usage analytics.",
      "Respond to your support requests and feedback.",
      "Comply with legal obligations (tax records, lawful requests from authorities).",
    ],
  },
  {
    icon: <ExternalLink className="w-5 h-5" />,
    title: "Service providers and sub-processors",
    body: "We share the minimum information necessary with the following sub-processors. Each is contractually bound to protect your data and use it only to provide their service to us.",
    list: [
      "**Google Cloud / Firebase** (Authentication, Firestore, Cloud Storage) — hosts your account, books, and generated images.",
      "**Google Gemini API** — processes your prompts to generate and refine images. Governed by Google's API terms.",
      "**OpenAI API** — powers Sparky chat, brief planning, and metadata generation. Governed by OpenAI's API terms.",
      "**Vercel** — application hosting and serverless functions.",
      "**Lemon Squeezy** — merchant of record for payments, taxes, and invoicing.",
      "**Sentry** — application error monitoring and performance tracing.",
      "**Resend** — transactional email delivery.",
      "**Etsy, Pinterest, Gumroad** — only when you explicitly connect them; data flows are limited to the publish action you initiate.",
    ],
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "International data transfers",
    body: "CrayonSparks is operated from India. Our service providers may process and store data in the United States, the European Union, India, and other jurisdictions. When personal data is transferred outside your country, we rely on appropriate safeguards — including Standard Contractual Clauses (EU/UK), adequacy decisions where available, and the data-protection terms required by India's DPDP framework — to keep your data protected.",
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: "Data retention",
    list: [
      "**Account data** is retained while your account is active and for up to 90 days after you delete it (to allow billing reversal and abuse review), then permanently deleted.",
      "**Generated books and images** are retained until you delete them. Deletion is permanent and immediate.",
      "**Billing records** are retained for the period required by tax and accounting laws (typically 7 years).",
      "**Operational logs and error traces** are retained for up to 90 days.",
      "**Support communications** are retained for up to 24 months for quality and dispute resolution.",
    ],
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: "Security",
    body: "We protect your information with industry-standard measures, including HTTPS/TLS in transit, encryption at rest on managed databases and object storage, scoped service accounts, least-privilege access controls, OAuth-token encryption, multi-factor authentication on administrative accounts, and continuous monitoring for anomalous activity. No method of transmission or storage is 100% secure; if we ever experience a security incident that affects your personal data, we will notify affected users and the relevant authorities within the timeframes required by applicable law.",
  },
  {
    icon: <UserCheck className="w-5 h-5" />,
    title: "Your rights",
    body: "Subject to applicable law, you have the right to:",
    list: [
      "Access the personal data we hold about you and receive a copy in a portable format.",
      "Correct inaccurate or outdated information.",
      "Delete your account and all associated personal data.",
      "Withdraw consent at any time for any processing based on consent.",
      "Restrict or object to certain types of processing.",
      "Lodge a complaint with your local data-protection authority (such as the ICO in the UK, your supervisory authority in the EU, or the Data Protection Board of India).",
    ],
  },
  {
    icon: <Cookie className="w-5 h-5" />,
    title: "Cookies and similar technologies",
    body: "We use only strictly necessary cookies and equivalent storage required to operate the Service — primarily for authentication (keeping you signed in), security (CSRF protection), and remembering your interface preferences. We do not use advertising cookies or cross-site trackers. Your browser settings allow you to block or delete cookies, though doing so will prevent you from signing in.",
  },
  {
    icon: <Baby className="w-5 h-5" />,
    title: "Children",
    body: "The Service is intended for adults — parents, educators, and creators producing content for children. We do not knowingly create accounts for children under 13 (or under 16 in jurisdictions where that is the digital-age threshold). If you believe a child has created an account, please contact us and we will remove it promptly.",
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "Changes to this policy",
    body: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or for other operational reasons. The "Effective date" at the top of this page indicates when the latest version took effect. Material changes will be communicated by email or by a prominent in-app notice at least 14 days before they take effect.`,
  },
  {
    icon: <Mail className="w-5 h-5" />,
    title: "Contact us",
    body: "Questions about this Privacy Policy or your data? Email crayonsparksai@gmail.com. We aim to respond within 5 business days. For data-subject access, correction, or deletion requests, please use the same address and include enough information for us to verify your identity.",
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

export default function PrivacyPage() {
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
              Privacy <span className="gradient-text">Policy</span>
            </h1>
            <p className="mt-4 text-neutral-400">
              Effective date: {EFFECTIVE_DATE}
            </p>
          </div>

          <div className="space-y-4">
            {SECTIONS.map((s, i) => (
              <section
                key={s.title}
                className="rounded-2xl p-6 md:p-7 bg-zinc-900/60 backdrop-blur-xl border border-white/10 hover:border-violet-500/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${
                      s.kind === "not-collects"
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        : "bg-linear-to-br from-violet-500/20 to-cyan-500/20 border-violet-500/30 text-violet-300"
                    }`}
                  >
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
                            <span
                              className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${
                                s.kind === "not-collects"
                                  ? "bg-emerald-400"
                                  : "bg-violet-400"
                              }`}
                            />
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
