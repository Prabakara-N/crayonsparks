import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { buildOrganization, buildWebSite } from "@/lib/seo-schema";
import { Analytics } from "@vercel/analytics/next";
import { DialogProvider } from "@/components/ui/confirm-dialog";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ReferralSurvey } from "@/components/onboarding/referral-survey";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    default: "CrayonSparks — Generate Coloring Books in Minutes",
    template: "%s · CrayonSparks",
  },
  description:
    "AI-powered coloring book generator for Amazon KDP creators. Pick a theme, generate 20 kid-friendly pages, publish & earn. Built for parents, teachers, and KDP sellers.",
  keywords: [
    "AI coloring book generator",
    "Amazon KDP coloring book",
    "kids coloring pages",
    "Gemini Nano Banana",
    "coloring book AI",
    "Prabakaran",
  ],
  authors: [{ name: "Prabakaran" }],
  openGraph: {
    title: "CrayonSparks — Generate Coloring Books in Minutes",
    description:
      "Pick a theme, generate 20 kid-friendly pages, publish & earn on Amazon KDP.",
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "CrayonSparks",
  },
  twitter: {
    card: "summary_large_image",
    title: "CrayonSparks — Generate Coloring Books in Minutes",
    description:
      "Pick a theme, generate 20 kid-friendly pages, publish & earn on Amazon KDP.",
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
        <Analytics />
      </body>
    </html>
  );
}
