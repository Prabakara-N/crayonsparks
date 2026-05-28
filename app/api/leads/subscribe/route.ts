import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { LeadsWelcomeEmail } from "@/lib/email/leads-welcome-email";
import { getEmailBrand, getFromAddress } from "@/lib/email/brand";
import { findCategory } from "@/lib/prompts";
import { rateLimitByIp } from "@/lib/api/rate-limit";

export const runtime = "nodejs";

interface Body {
  email?: string;
  categorySlug?: string;
  source?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const limit = await rateLimitByIp({
    req,
    kind: "leads-subscribe",
    limit: 10,
  });
  if (!limit.ok) return limit.response;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const slug = (body.categorySlug ?? "").trim();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 },
    );
  }
  const category = slug ? findCategory(slug) : null;

  const apiKey = process.env.RESEND_API_KEY;
  const from = getFromAddress("leads");
  if (!apiKey) {
    console.warn(
      "[leads/subscribe] RESEND_API_KEY not set — skipping email send.",
    );
    return NextResponse.json({
      ok: true,
      queued: false,
      note: "Received but email is not configured on the server.",
    });
  }

  try {
    const resend = new Resend(apiKey);
    const categoryName = category?.name ?? "coloring pages";
    const subject = category
      ? `Your free ${categoryName} coloring pages from CrayonSparks`
      : `Your free coloring pages from CrayonSparks`;
    const { homeUrl, logoUrl } = getEmailBrand();
    const playgroundUrl = `${homeUrl}/playground`;

    const node = LeadsWelcomeEmail({
      categoryName,
      playgroundUrl,
      homeUrl,
      logoUrl,
    });
    const [html, text] = await Promise.all([
      render(node),
      render(node, { plainText: true }),
    ]);
    await resend.emails.send({ from, to: email, subject, html, text });
    return NextResponse.json({ ok: true, queued: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed.";
    console.error("[leads/subscribe]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
