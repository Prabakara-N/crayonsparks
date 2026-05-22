import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/server-require-auth";
import { exchangeGumroadCode } from "@/lib/integrations/gumroad/oauth";
import { getGumroadUser } from "@/lib/integrations/gumroad/client";
import { saveIntegration } from "@/lib/integrations/common/token-store";

export const runtime = "nodejs";

function appBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Gumroad redirects here after consent. Verifies CSRF state, exchanges the
 * code for a token, stores it encrypted, then returns the user to the
 * integrations page with a `?gumroad=<status>` flag.
 */
export async function GET(req: Request) {
  const result = (status: string) =>
    NextResponse.redirect(
      `${appBase()}/account/integrations?gumroad=${status}`,
    );

  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.redirect(
      `${appBase()}/login?next=/account/integrations`,
    );
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error") || !code) {
    return result("denied");
  }

  const savedState = (await cookies()).get("gumroad_oauth_state")?.value;
  if (!state || !savedState || state !== savedState) {
    return result("badstate");
  }

  try {
    const { accessToken, scope } = await exchangeGumroadCode(code);
    const account = await getGumroadUser(accessToken);
    await saveIntegration({
      uid: auth.user.userId,
      platform: "gumroad",
      accessToken,
      scopes: scope,
      accountId: account.userId,
      accountHandle: account.name,
    });
    const res = result("connected");
    res.cookies.delete("gumroad_oauth_state");
    return res;
  } catch {
    return result("error");
  }
}
