import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-require-auth";
import {
  buildEtsyAuthorizeUrl,
  generatePkcePair,
} from "@/lib/integrations/etsy/oauth";

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
  const { codeVerifier, codeChallenge } = generatePkcePair();

  let authorizeUrl: string;
  try {
    authorizeUrl = buildEtsyAuthorizeUrl(state, codeChallenge);
  } catch {
    return NextResponse.redirect(
      `${appBase()}/account/integrations?etsy=notconfigured`,
    );
  }

  const res = NextResponse.redirect(authorizeUrl);
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  res.cookies.set("etsy_oauth_state", state, cookieOpts);
  res.cookies.set("etsy_oauth_pkce", codeVerifier, cookieOpts);
  return res;
}
