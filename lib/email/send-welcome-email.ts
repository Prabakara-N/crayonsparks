import "server-only";

import { Resend } from "resend";
import { render } from "@react-email/render";
import { WelcomeEmail } from "./welcome-email";
import { getEmailBrand } from "./brand";

const DEFAULT_FROM = "CrayonSparks <onboarding@resend.dev>";
const DEFAULT_SUPPORT = "crayonsparksai@gmail.com";

interface SendWelcomeEmailArgs {
  to: string;
  firstName?: string | null;
}

export async function sendWelcomeEmail(
  args: SendWelcomeEmailArgs,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not configured" };

  const from = process.env.RESEND_FROM ?? DEFAULT_FROM;
  const { homeUrl, logoUrl } = getEmailBrand();
  const playgroundUrl = `${homeUrl}/playground`;
  const accountUrl = `${homeUrl}/account`;
  const supportEmail = process.env.SUPPORT_EMAIL ?? DEFAULT_SUPPORT;

  try {
    const node = WelcomeEmail({
      firstName: args.firstName ?? null,
      playgroundUrl,
      accountUrl,
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
      subject: "Welcome to CrayonSparks — let's make something special",
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
