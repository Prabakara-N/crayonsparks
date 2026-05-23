import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-require-auth";
import { buildPinterestAuthorizeUrl } from "@/lib/integrations/pinterest/oauth";

export const runtime = "nodejs";

function appBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.redirect(
      `${appBase()}/login?next=/account/integrations`,
    );
  }

  const state = crypto.randomBytes(16).toString("hex");

  let authorizeUrl: string;
  try {
    authorizeUrl = buildPinterestAuthorizeUrl(state);
  } catch {
    return NextResponse.redirect(
      `${appBase()}/account/integrations?pinterest=notconfigured`,
    );
  }

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set("pinterest_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
