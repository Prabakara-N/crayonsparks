import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { ContactEmail } from "@/lib/email/contact-email";
import { getEmailBrand } from "@/lib/email/brand";
import { rateLimitByIp } from "@/lib/api/rate-limit";

export const runtime = "nodejs";

interface Body {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  honeypot?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const limit = await rateLimitByIp({
    req,
    kind: "contact",
    limit: 5,
  });
  if (!limit.ok) return limit.response;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.honeypot && body.honeypot.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 },
    );
  }
  if (!message || message.length < 5) {
    return NextResponse.json(
      { error: "Please write a message (at least 5 characters)." },
      { status: 400 },
    );
  }
  if (message.length > 5000) {
    return NextResponse.json(
      { error: "Message too long (max 5000 characters)." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = "CrayonSparks <contact@crayonsparks.com>";
  const to = process.env.CONTACT_TO ?? "crayonsparksai@gmail.com";
  if (!apiKey) {
    console.warn(
      "[contact] RESEND_API_KEY not set — accepting but not sending.",
    );
    return NextResponse.json({
      ok: true,
      queued: false,
      note: "Received but email is not configured on the server.",
    });
  }

  try {
    const { logoUrl } = getEmailBrand();
    const node = ContactEmail({
      name,
      email,
      subject: subject || undefined,
      message,
      logoUrl,
    });
    const [html, text] = await Promise.all([
      render(node),
      render(node, { plainText: true }),
    ]);
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: subject
        ? `[CrayonSparks] ${subject}`
        : `[CrayonSparks] New message from ${name}`,
      html,
      text,
    });
    return NextResponse.json({ ok: true, queued: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Send failed.";
    console.error("[contact]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
