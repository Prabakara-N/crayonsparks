import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { buildOrganization, buildWebSite } from "@/lib/seo-schema";
import { Analytics } from "@vercel/analytics/next";
import { DialogProvider } from "@/components/ui/confirm-dialog";
import { Toaster } from "@/components/ui/sonner";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ReferralSurvey } from "@/components/onboarding/referral-survey";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://crayonsparks.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "CrayonSparks — AI Story Books, Coloring Books & Activity Books in Minutes",
    template: "%s · CrayonSparks",
  },
  description:
    "AI book studio for parents and KDP creators. Turn any idea into a custom kids' book in minutes — story books, coloring books and activity books. Perfect for birthdays, return gifts, memory keepsakes, screen-free fun, or selling on Amazon KDP.",
  keywords: [
    "AI story book generator",
    "AI coloring book generator",
    "AI activity book maker",
    "custom kids book",
    "personalized children's book",
    "Amazon KDP coloring book",
    "kids book maker",
    "birthday gift book for kids",
    "return gift ideas for kids",
    "memory keepsake book",
    "screen-free activities for kids",
    "make a children's book online",
    "CrayonSparks",
  ],
  authors: [{ name: "Prabakaran" }],
  openGraph: {
    title:
      "CrayonSparks — AI Story Books, Coloring Books & Activity Books in Minutes",
    description:
      "Make a custom kids' book in minutes. For parents (birthdays, return gifts, keepsakes) and KDP creators. Story books · coloring books · activity books.",
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "CrayonSparks",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "CrayonSparks — AI Story Books, Coloring Books & Activity Books in Minutes",
    description:
      "Make a custom kids' book in minutes. For parents (birthdays, return gifts, keepsakes) and KDP creators.",
  },
  verification: {
    google: "r4wplTuoD0-FkXXdUJ6_xBipt1PFHUpNL1d_n2PRedE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("dark", "h-full", "antialiased", spaceGrotesk.variable, jetbrains.variable, "font-sans", geist.variable)}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-black text-white font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildOrganization()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildWebSite()),
          }}
        />
        <AuthProvider>
          <TooltipProvider delayDuration={150}>
            <DialogProvider>{children}</DialogProvider>
            <ReferralSurvey />
            <FeedbackWidget />
          </TooltipProvider>
        </AuthProvider>
        <Toaster position="bottom-right" richColors closeButton />
        <OfflineIndicator />
        <Analytics />
      </body>
    </html>
  );
}
