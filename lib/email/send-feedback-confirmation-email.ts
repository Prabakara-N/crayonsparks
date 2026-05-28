import "server-only";

import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  FeedbackConfirmationEmail,
  type FeedbackConfirmationEmailProps,
} from "./feedback-confirmation-email";
import { getEmailBrand, getFromAddress } from "./brand";
import { FEEDBACK_KIND_LABELS } from "@/lib/feedback/types";

const DEFAULT_SUPPORT = "crayonsparksai@gmail.com";

interface SendArgs
  extends Omit<
    FeedbackConfirmationEmailProps,
    "logoUrl" | "homeUrl" | "supportEmail"
  > {
  to: string;
}

export async function sendFeedbackConfirmationEmail(
  args: SendArgs,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const from = getFromAddress("feedback");
  const { homeUrl, logoUrl } = getEmailBrand();
  const supportEmail = process.env.SUPPORT_EMAIL ?? DEFAULT_SUPPORT;
  const referenceTag = `#${args.feedbackId.slice(0, 8).toUpperCase()}`;
  const subject = `We got your ${FEEDBACK_KIND_LABELS[args.kind].toLowerCase()} — ${referenceTag}`;

  try {
    const node = FeedbackConfirmationEmail({
      recipientName: args.recipientName,
      feedbackId: args.feedbackId,
      kind: args.kind,
      title: args.title,
      body: args.body,
      logoUrl,
      homeUrl,
      supportEmail,
    });
    const [html, text] = await Promise.all([
      render(node),
      render(node, { plainText: true }),
    ]);
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: args.to,
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
