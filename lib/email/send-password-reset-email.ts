import "server-only";

import { Resend } from "resend";
import { render } from "@react-email/render";
import { PasswordResetEmail } from "./password-reset-email";
import { getEmailBrand, getFromAddress } from "./brand";

const DEFAULT_SUPPORT = "crayonsparksai@gmail.com";

interface SendPasswordResetEmailArgs {
  to: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(
  args: SendPasswordResetEmailArgs,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not configured" };

  const from = getFromAddress("password-reset");
  const { homeUrl, logoUrl } = getEmailBrand();
  const supportEmail = process.env.SUPPORT_EMAIL ?? DEFAULT_SUPPORT;

  try {
    const node = PasswordResetEmail({
      resetUrl: args.resetUrl,
      homeUrl,
      logoUrl,
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
      subject: "Reset your CrayonSparks password",
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
