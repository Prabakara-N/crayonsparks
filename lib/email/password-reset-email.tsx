import "server-only";

import {
  Body,
  Button,
  Container,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { EmailHead } from "./email-head";

export interface PasswordResetEmailProps {
  resetUrl: string;
  homeUrl: string;
  logoUrl: string;
  supportEmail: string;
}

export function PasswordResetEmail({
  resetUrl,
  homeUrl,
  logoUrl,
  supportEmail,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <EmailHead />
      <Preview>Reset your CrayonSparks password — link expires in 1 hour.</Preview>
      <Tailwind>
        <Body className="email-body bg-slate-50 font-sans">
          <Container className="email-card mx-auto my-8 max-w-[600px] rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Section
              className="rounded-t-2xl px-8 py-12 text-center"
              style={{
                backgroundColor: "#8b5cf6",
                backgroundImage:
                  "linear-gradient(to bottom right, #8b5cf6, #22d3ee)",
              }}
            >
              <Img
                src={logoUrl}
                alt="CrayonSparks"
                width={64}
                height={64}
                style={{
                  margin: "0 auto",
                  display: "block",
                  borderRadius: "14px",
                }}
              />
              <Heading
                as="h1"
                className="m-0 mt-4 text-3xl font-bold leading-tight text-white"
              >
                Reset your password
              </Heading>
              <Text className="m-0 mt-2 text-sm text-white/85">
                Let&apos;s get you back into your account.
              </Text>
            </Section>

            <Section className="px-8 py-6">
              <Text className="m-0 text-[15px] leading-relaxed text-slate-700">
                We received a request to reset the password for your CrayonSparks
                account. Click the button below to choose a new password. This
                link expires in one hour and can be used only once.
              </Text>
            </Section>

            <Section className="px-8 pb-8 pt-2 text-center">
              <Button
                href={resetUrl}
                style={{
                  backgroundColor: "#8b5cf6",
                  backgroundImage:
                    "linear-gradient(to right, #8b5cf6, #22d3ee)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: "14px 28px",
                  borderRadius: "9999px",
                  display: "inline-block",
                  boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
                }}
              >
                Reset my password →
              </Button>
              <Text className="m-0 mt-4 text-xs text-slate-500">
                Button not working? Paste this link into your browser:
              </Text>
              <Text className="m-0 mt-1 text-xs break-all text-slate-500">
                <a href={resetUrl} style={{ color: "#7c3aed", textDecoration: "none" }}>
                  {resetUrl}
                </a>
              </Text>
            </Section>

            <Hr className="mx-8 my-0 border-slate-200" />

            <Section className="px-8 py-5 text-center">
              <Text className="m-0 text-[13px] text-slate-600">
                Didn&apos;t request this? You can safely ignore this email — your
                password won&apos;t change.
              </Text>
              <Text className="m-0 mt-3 text-[13px] text-slate-600">
                Need help? Write to{" "}
                <a href={`mailto:${supportEmail}`} style={{ color: "#7c3aed", textDecoration: "none" }}>
                  {supportEmail}
                </a>
                .
              </Text>
              <Text className="m-0 mt-4 text-[11px] text-slate-400">
                <a href={homeUrl} style={{ color: "#7c3aed", textDecoration: "none" }}>
                  crayonsparks.com
                </a>{" "}
                · Made with care in TN, India
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
