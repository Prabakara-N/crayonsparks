import "server-only";

import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  FeedbackEmail,
  type FeedbackEmailProps,
} from "./feedback-email";
import { getEmailBrand } from "./brand";
import { FEEDBACK_KIND_LABELS } from "@/lib/feedback/types";

const DEFAULT_FROM = "CrayonSparks <onboarding@resend.dev>";
const DEFAULT_TO = "crayonsparksai@gmail.com";
const DEFAULT_ADMIN_BASE = "https://www.crayonsparks.com";

export async function sendFeedbackEmail(
  props: Omit<FeedbackEmailProps, "adminUrl" | "logoUrl"> & {
    replyTo?: string | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  const from = process.env.RESEND_FROM ?? DEFAULT_FROM;
  const to = process.env.FEEDBACK_NOTIFY_TO ?? DEFAULT_TO;
  const adminBase = process.env.ADMIN_BASE_URL ?? DEFAULT_ADMIN_BASE;
  const { logoUrl } = getEmailBrand();
  const adminUrl = `${adminBase}/admin/feedback?id=${encodeURIComponent(props.feedbackId)}`;

  try {
    const node = FeedbackEmail({
      ...props,
      adminUrl,
      logoUrl,
    });
    const [html, text] = await Promise.all([
      render(node),
      render(node, { plainText: true }),
    ]);

    const subject = `[CrayonSparks ${FEEDBACK_KIND_LABELS[props.kind]}] ${props.title}`;

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      replyTo: props.replyTo ?? props.userEmail ?? undefined,
      subject,
      html,
      text,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "send failed",
    };
  }
}
