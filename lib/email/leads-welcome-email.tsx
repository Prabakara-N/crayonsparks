import "server-only";

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export interface LeadsWelcomeEmailProps {
  categoryName: string;
  playgroundUrl: string;
  homeUrl: string;
  logoUrl: string;
}

export function LeadsWelcomeEmail({
  categoryName,
  playgroundUrl,
  homeUrl,
  logoUrl,
}: LeadsWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Your free ${categoryName} coloring pages are on the way`}</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto my-8 max-w-[600px] rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Section className="rounded-t-2xl bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 px-8 py-10 text-center">
              <Img
                src={logoUrl}
                alt="CrayonSparks"
                width={56}
                height={56}
                style={{
                  margin: "0 auto",
                  display: "block",
                  borderRadius: "12px",
                  background: "#ffffff",
                  padding: "6px",
                }}
              />
              <Heading
                as="h1"
                className="m-0 mt-4 text-2xl font-bold leading-tight text-white"
              >
                Your pages are on the way
              </Heading>
              <Text className="m-0 mt-2 text-sm text-white/85">
                Thanks for subscribing — 5 free {categoryName} coloring pages are
                being prepared for you right now.
              </Text>
            </Section>

            <Section className="px-8 py-6">
              <Text className="m-0 mb-3 text-[15px] leading-relaxed text-slate-700">
                Your PDF will land in your inbox in the next few minutes. While
                you wait, you can also make your own custom book in our
                playground.
              </Text>
              <ul style={{ margin: "12px 0 16px", paddingLeft: "20px", color: "#475569", fontSize: "14px", lineHeight: 1.8 }}>
                <li>Generate a personalised coloring book in minutes</li>
                <li>Make a custom story book — perfect for a birthday or keepsake</li>
                <li>Reply to this email if anything goes wrong — a real human reads them</li>
              </ul>
            </Section>

            <Section className="px-8 pb-6 text-center">
              <Button
                href={playgroundUrl}
                className="rounded-full bg-violet-600 px-7 py-3 text-sm font-semibold text-white no-underline shadow-sm"
              >
                Open the playground →
              </Button>
            </Section>

            <Section className="rounded-b-2xl border-t border-slate-200 px-8 py-5 text-center">
              <Text className="m-0 text-[11px] text-slate-500">
                You&apos;re getting this because you requested free coloring pages
                at{" "}
                <a href={homeUrl} style={{ color: "#7c3aed", textDecoration: "none" }}>
                  crayonsparks.com
                </a>
                . Made with care in TN, India.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
