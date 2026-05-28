import "server-only";

import {
  Body,
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
import {
  FEEDBACK_KIND_LABELS,
  type FeedbackKind,
} from "@/lib/feedback/types";
import { EmailHead } from "./email-head";

export interface FeedbackConfirmationEmailProps {
  recipientName?: string | null;
  feedbackId: string;
  kind: FeedbackKind;
  title: string;
  body: string;
  logoUrl: string;
  homeUrl: string;
  supportEmail: string;
}

function expectedReplyLine(kind: FeedbackKind): string {
  switch (kind) {
    case "bug":
      return "We triage bugs the same business day. If it's a blocker, reply to this email and we'll prioritise it.";
    case "feature":
      return "We read every feature request. If we ship it, we'll let you know — and a few requests find their way into the next release each week.";
    case "question":
      return "We aim to answer questions within 1 business day. If your question is time-sensitive, mention it in a reply to this email.";
    case "feedback":
    default:
      return "We read every message, even when we don't reply. The good ones shape the next version of CrayonSparks.";
  }
}

export function FeedbackConfirmationEmail({
  recipientName,
  feedbackId,
  kind,
  title,
  body,
  logoUrl,
  homeUrl,
  supportEmail,
}: FeedbackConfirmationEmailProps) {
  const firstName = recipientName?.trim().split(/\s+/)[0] ?? null;
  const greeting = firstName ? `Thanks, ${firstName}!` : "Thanks for the message!";
  const referenceTag = `#${feedbackId.slice(0, 8).toUpperCase()}`;
  return (
    <Html>
      <EmailHead />
      <Preview>{`We received your ${FEEDBACK_KIND_LABELS[kind].toLowerCase()} — reference ${referenceTag}`}</Preview>
      <Tailwind>
        <Body className="email-body bg-slate-50 font-sans">
          <Container className="email-card mx-auto my-8 max-w-[600px] rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Section
              className="rounded-t-2xl px-8 py-8 text-center"
              style={{
                backgroundColor: "#7c3aed",
                backgroundImage:
                  "linear-gradient(to right, #7c3aed, #06b6d4)",
              }}
            >
              <Img
                src={logoUrl}
                alt="CrayonSparks"
                width={56}
                height={56}
                style={{
                  margin: "0 auto",
                  display: "block",
                  borderRadius: "12px",
                }}
              />
              <Heading
                as="h1"
                className="m-0 mt-4 text-2xl font-bold leading-tight text-white"
              >
                {greeting}
              </Heading>
              <Text className="m-0 mt-2 text-sm text-white/85">
                We received your {FEEDBACK_KIND_LABELS[kind].toLowerCase()} —
                reference {referenceTag}.
              </Text>
            </Section>

            <Section className="px-8 py-6">
              <Text className="m-0 text-[15px] leading-relaxed text-slate-700">
                {expectedReplyLine(kind)}
              </Text>
            </Section>

            <Section className="px-8 pb-2">
              <Heading
                as="h3"
                className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                What you sent us
              </Heading>
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  background: "#f8fafc",
                }}
              >
                <Text className="m-0 text-[13px] font-semibold text-slate-900">
                  {title}
                </Text>
                <Text className="m-0 mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                  {body}
                </Text>
              </div>
            </Section>

            <Hr className="mx-8 my-6 border-slate-200" />

            <Section className="px-8 pb-6 text-center">
              <Text className="m-0 text-[13px] text-slate-600">
                Need to add more detail or change anything? Just reply to this
                email — we&apos;ll see your update on the same ticket.
              </Text>
              <Text className="m-0 mt-3 text-[12px] text-slate-500">
                Or write directly to{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  style={{ color: "#7c3aed", textDecoration: "none" }}
                >
                  {supportEmail}
                </a>
                .
              </Text>
              <Text className="m-0 mt-4 text-[13px] font-medium text-slate-700">
                — The CrayonSparks team
              </Text>
            </Section>

            <Section className="rounded-b-2xl border-t border-slate-200 px-8 py-4 text-center">
              <Text className="m-0 text-[11px] text-slate-400">
                CrayonSparks ·{" "}
                <a
                  href={homeUrl}
                  style={{ color: "#7c3aed", textDecoration: "none" }}
                >
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
