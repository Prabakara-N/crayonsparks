import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/server-require-auth";
import { exchangePinterestCode } from "@/lib/integrations/pinterest/oauth";
import { getPinterestAccount } from "@/lib/integrations/pinterest/client";
import { saveIntegration } from "@/lib/integrations/common/token-store";

export const runtime = "nodejs";

function appBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function GET(req: Request) {
  const result = (status: string) =>
    NextResponse.redirect(
      `${appBase()}/account/integrations?pinterest=${status}`,
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

  const savedState = (await cookies()).get("pinterest_oauth_state")?.value;
  if (!state || !savedState || state !== savedState) {
    return result("badstate");
  }

  try {
    const { accessToken, scope } = await exchangePinterestCode(code);
    const account = await getPinterestAccount(accessToken);
    await saveIntegration({
      uid: auth.user.userId,
      platform: "pinterest",
      accessToken,
      scopes: scope,
      accountId: account.username,
      accountHandle: account.username,
    });
    const res = result("connected");
    res.cookies.delete("pinterest_oauth_state");
    return res;
  } catch {
    return result("error");
  }
}
