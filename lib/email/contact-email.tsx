import "server-only";

import {
  Body,
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

export interface ContactEmailProps {
  name: string;
  email: string;
  subject?: string;
  message: string;
  logoUrl: string;
}

export function ContactEmail({
  name,
  email,
  subject,
  message,
  logoUrl,
}: ContactEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Message from ${name} via crayonsparks.com`}</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto my-8 max-w-[600px] rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                      New contact message
                    </Heading>
                    <Text className="m-0 mt-1 text-sm text-violet-100">
                      Submitted via crayonsparks.com/contact
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>

            <Section className="px-8 pt-6 pb-2">
              <table cellPadding={0} cellSpacing={0} width="100%" style={{ borderCollapse: "collapse" }}>
                <tr>
                  <td style={{ padding: "6px 0", color: "#64748b", fontSize: "13px", width: "90px" }}>
                    From
                  </td>
                  <td style={{ padding: "6px 0", color: "#0f172a", fontSize: "14px" }}>
                    <strong>{name}</strong> &lt;{email}&gt;
                  </td>
                </tr>
                {subject ? (
                  <tr>
                    <td style={{ padding: "6px 0", color: "#64748b", fontSize: "13px" }}>Subject</td>
                    <td style={{ padding: "6px 0", color: "#0f172a", fontSize: "14px" }}>
                      {subject}
                    </td>
                  </tr>
                ) : null}
              </table>
            </Section>

            <Hr className="mx-8 my-0 border-slate-200" />

            <Section className="px-8 py-6">
              <Heading
                as="h3"
                className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Message
              </Heading>
              <Text className="m-0 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                {message}
              </Text>
            </Section>

            <Section className="px-8 pb-8 text-center">
              <Text className="m-0 text-xs text-slate-500">
                Reply to this email to respond directly to {name}.
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
