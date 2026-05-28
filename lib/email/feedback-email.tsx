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
import type { FeedbackKind } from "@/lib/feedback/types";
import { FEEDBACK_KIND_LABELS } from "@/lib/feedback/types";
import { EmailHead } from "./email-head";

export interface FeedbackEmailProps {
  feedbackId: string;
  kind: FeedbackKind;
  title: string;
  body: string;
  userEmail: string | null;
  userId: string;
  page: string | null;
  source: "widget" | "post-book-survey";
  bookKind?: "coloring" | "story";
  adminUrl: string;
  logoUrl: string;
}

const KIND_BADGE: Record<FeedbackKind, { bg: string; fg: string; label: string }> = {
  bug: { bg: "#FEE2E2", fg: "#991B1B", label: "Bug" },
  feedback: { bg: "#DDD6FE", fg: "#5B21B6", label: "Feedback" },
  feature: { bg: "#DBEAFE", fg: "#1E40AF", label: "Feature request" },
  question: { bg: "#FEF3C7", fg: "#92400E", label: "Question" },
};

export function FeedbackEmail({
  feedbackId,
  kind,
  title,
  body,
  userEmail,
  userId,
  page,
  source,
  bookKind,
  adminUrl,
  logoUrl,
}: FeedbackEmailProps) {
  const badge = KIND_BADGE[kind];
  const sourceLabel =
    source === "post-book-survey"
      ? `Post-first-${bookKind ?? "book"} survey`
      : "In-app feedback widget";
  const preview = `${FEEDBACK_KIND_LABELS[kind]} from ${userEmail ?? "anonymous"} — ${title}`;
  return (
    <Html>
      <EmailHead />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="email-body bg-slate-50 font-sans">
          <Container className="email-card mx-auto my-8 max-w-[600px] rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
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
                New {FEEDBACK_KIND_LABELS[kind]}
              </Heading>
              <Text className="m-0 mt-2 text-sm text-violet-100">
                CrayonSparks · {sourceLabel}
              </Text>
            </Section>

            <Section className="px-8 pt-6 pb-2 text-center">
              <span
                style={{
                  background: badge.bg,
                  color: badge.fg,
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  display: "inline-block",
                }}
              >
                {badge.label}
              </span>
              <Heading
                as="h2"
                className="mt-3 mb-0 text-xl font-semibold leading-snug text-slate-900"
              >
                {title}
              </Heading>
            </Section>

            <Section className="px-8 pt-3 pb-6 text-center">
              <Text className="m-0 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                {body}
              </Text>
            </Section>

            <Hr className="mx-8 my-0 border-slate-200" />

            <Section className="px-8 py-5 text-center">
              <Text className="m-0 mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                From
              </Text>
              <Text className="m-0 mt-1 text-[13px] text-slate-900">
                {userEmail ?? "(no email on file)"}
              </Text>

              <Text className="m-0 mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                User ID
              </Text>
              <Text className="m-0 mt-1 text-[13px] text-slate-900" style={{ fontFamily: "monospace" }}>
                {userId}
              </Text>

              {page ? (
                <>
                  <Text className="m-0 mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Page
                  </Text>
                  <Text className="m-0 mt-1 text-[13px] text-slate-900" style={{ fontFamily: "monospace" }}>
                    {page}
                  </Text>
                </>
              ) : null}

              <Text className="m-0 mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                ID
              </Text>
              <Text className="m-0 mt-1 text-[13px] text-slate-900" style={{ fontFamily: "monospace" }}>
                {feedbackId}
              </Text>
            </Section>

            <Section className="px-8 pb-8 text-center">
              <Button
                href={adminUrl}
                style={{
                  backgroundColor: "#8b5cf6",
                  backgroundImage:
                    "linear-gradient(to right, #8b5cf6, #22d3ee)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: "12px 24px",
                  borderRadius: "9999px",
                  display: "inline-block",
                  boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
                }}
              >
                Open in admin dashboard
              </Button>
              <Text className="m-0 mt-3 text-xs text-slate-500">
                Reply to this email to contact the reporter directly.
              </Text>
            </Section>
          </Container>

          <Text className="mt-2 text-center text-[11px] text-slate-400">
            Sent by CrayonSparks · crayonsparks.com
          </Text>
        </Body>
      </Tailwind>
    </Html>
  );
}
