import "server-only";

import {
  Body,
  Button,
  Container,
  Head,
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
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto my-8 max-w-[600px] rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
            <Section className="rounded-t-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-6">
              <table cellPadding={0} cellSpacing={0} width="100%" style={{ borderCollapse: "collapse" }}>
                <tr>
                  <td style={{ width: "48px", verticalAlign: "middle" }}>
                    <Img
                      src={logoUrl}
                      alt="CrayonSparks"
                      width={40}
                      height={40}
                      style={{
                        display: "block",
                        borderRadius: "8px",
                        background: "#ffffff",
                        padding: "4px",
                      }}
                    />
                  </td>
                  <td style={{ verticalAlign: "middle", paddingLeft: "12px" }}>
                    <Heading
                      as="h1"
                      className="m-0 text-2xl font-bold leading-tight text-white"
                    >
                      New {FEEDBACK_KIND_LABELS[kind]}
                    </Heading>
                    <Text className="m-0 mt-1 text-sm text-violet-100">
                      CrayonSparks · {sourceLabel}
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>

            <Section className="px-8 pt-6 pb-2">
              <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse" }}>
                <tr>
                  <td>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.fg,
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              </table>
              <Heading
                as="h2"
                className="mt-3 mb-0 text-xl font-semibold leading-snug text-slate-900"
              >
                {title}
              </Heading>
            </Section>

            <Section className="px-8 pt-3 pb-6">
              <Text className="m-0 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                {body}
              </Text>
            </Section>

            <Hr className="mx-8 my-0 border-slate-200" />

            <Section className="px-8 py-5">
              <table cellPadding={0} cellSpacing={0} width="100%" style={{ borderCollapse: "collapse" }}>
                <tr>
                  <td style={{ padding: "4px 0", color: "#64748b", fontSize: "13px", width: "120px" }}>
                    From
                  </td>
                  <td style={{ padding: "4px 0", color: "#0f172a", fontSize: "13px" }}>
                    {userEmail ?? "(no email on file)"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", color: "#64748b", fontSize: "13px" }}>User ID</td>
                  <td style={{ padding: "4px 0", color: "#0f172a", fontSize: "13px", fontFamily: "monospace" }}>
                    {userId}
                  </td>
                </tr>
                {page ? (
                  <tr>
                    <td style={{ padding: "4px 0", color: "#64748b", fontSize: "13px" }}>Page</td>
                    <td style={{ padding: "4px 0", color: "#0f172a", fontSize: "13px", fontFamily: "monospace" }}>
                      {page}
                    </td>
                  </tr>
                ) : null}
                <tr>
                  <td style={{ padding: "4px 0", color: "#64748b", fontSize: "13px" }}>ID</td>
                  <td style={{ padding: "4px 0", color: "#0f172a", fontSize: "13px", fontFamily: "monospace" }}>
                    {feedbackId}
                  </td>
                </tr>
              </table>
            </Section>

            <Section className="px-8 pb-8 text-center">
              <Button
                href={adminUrl}
                className="rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white no-underline shadow-sm"
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
