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

export interface WelcomeEmailProps {
  firstName?: string | null;
  playgroundUrl: string;
  accountUrl: string;
  homeUrl: string;
  logoUrl: string;
  supportEmail: string;
}

export function WelcomeEmail({
  firstName,
  playgroundUrl,
  accountUrl,
  homeUrl,
  logoUrl,
  supportEmail,
}: WelcomeEmailProps) {
  const greeting = firstName ? `Welcome, ${firstName}!` : "Welcome to CrayonSparks!";
  return (
    <Html>
      <EmailHead />
      <Preview>{`${greeting} Make your first coloring or story book in minutes.`}</Preview>
      <Tailwind>
        <Body className="email-body bg-slate-50 font-sans">
          <Container className="email-card mx-auto my-8 max-w-[600px] rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Section
              className="rounded-t-2xl px-8 py-12 text-center"
              style={{
                backgroundColor: "#7c3aed",
                backgroundImage:
                  "linear-gradient(to bottom right, #7c3aed, #d946ef, #fbbf24)",
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
                {greeting}
              </Heading>
              <Text className="m-0 mt-2 text-sm text-white/85">
                Welcome aboard. Let&apos;s make something a kid will treasure.
              </Text>
            </Section>

            <Section className="px-8 py-6">
              <Text className="m-0 text-[15px] leading-relaxed text-slate-700">
                CrayonSparks turns a one-line idea into a print-ready
                children&apos;s book — full-color story books or black-and-white
                coloring books, with cover, interior pages, and KDP-ready PDFs
                in one flow.
              </Text>
            </Section>

            <Section className="px-8 pb-2">
              <Heading
                as="h3"
                className="m-0 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Here&apos;s how to start
              </Heading>
              <table cellPadding={0} cellSpacing={0} width="100%" style={{ borderCollapse: "collapse" }}>
                <tr>
                  <td style={{ verticalAlign: "top", padding: "8px 0 8px 0", width: "32px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: "24px",
                        height: "24px",
                        borderRadius: "9999px",
                        background: "#ede9fe",
                        color: "#6d28d9",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: 700,
                        lineHeight: "24px",
                      }}
                    >
                      1
                    </span>
                  </td>
                  <td style={{ padding: "8px 0 8px 12px", color: "#0f172a", fontSize: "14px", lineHeight: 1.6 }}>
                    <strong>Type a basic idea.</strong> Even one line is
                    enough — name a character or two, pick an age range, and
                    let our planner do the rest.
                  </td>
                </tr>
                <tr>
                  <td style={{ verticalAlign: "top", padding: "8px 0 8px 0" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: "24px",
                        height: "24px",
                        borderRadius: "9999px",
                        background: "#ede9fe",
                        color: "#6d28d9",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: 700,
                        lineHeight: "24px",
                      }}
                    >
                      2
                    </span>
                  </td>
                  <td style={{ padding: "8px 0 8px 12px", color: "#0f172a", fontSize: "14px", lineHeight: 1.6 }}>
                    <strong>Review the plan.</strong> Tweak characters, palette,
                    dialogue, and page scenes before any image is generated.
                  </td>
                </tr>
                <tr>
                  <td style={{ verticalAlign: "top", padding: "8px 0 8px 0" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: "24px",
                        height: "24px",
                        borderRadius: "9999px",
                        background: "#ede9fe",
                        color: "#6d28d9",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: 700,
                        lineHeight: "24px",
                      }}
                    >
                      3
                    </span>
                  </td>
                  <td style={{ padding: "8px 0 8px 12px", color: "#0f172a", fontSize: "14px", lineHeight: 1.6 }}>
                    <strong>Generate, edit, and download.</strong> Drag speech
                    bubbles, swap colors, regenerate pages, then download the
                    full KDP-ready package — cover PDF, interior PDF, and A4
                    PDF.
                  </td>
                </tr>
              </table>
            </Section>

            <Section className="px-8 pb-8 pt-2 text-center">
              <Button
                href={playgroundUrl}
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
                Start your first book →
              </Button>
              <Text className="m-0 mt-3 text-xs text-slate-500">
                Free credits are waiting in your account.
              </Text>
            </Section>

            <Hr className="mx-8 my-0 border-slate-200" />

            <Section className="px-8 py-5 text-center">
              <Text className="m-0 text-[13px] text-slate-600">
                Need help or have an idea?
              </Text>
              <Text className="m-0 mt-1 text-[13px] text-slate-600">
                Reply to this email or write to{" "}
                <a href={`mailto:${supportEmail}`} style={{ color: "#7c3aed", textDecoration: "none" }}>
                  {supportEmail}
                </a>
                .
              </Text>
              <Text className="m-0 mt-4 text-[13px] font-medium text-slate-700">
                — The CrayonSparks team
              </Text>
              <Text className="m-0 mt-3 text-[11px] text-slate-400">
                Visit your{" "}
                <a href={accountUrl} style={{ color: "#7c3aed", textDecoration: "none" }}>
                  account
                </a>{" "}
                ·{" "}
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
