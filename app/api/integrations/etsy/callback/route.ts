import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/server-require-auth";
import { exchangeEtsyCode } from "@/lib/integrations/etsy/oauth";
import { getEtsyMe, getEtsyShop } from "@/lib/integrations/etsy/client";
import { saveIntegration } from "@/lib/integrations/common/token-store";

export const runtime = "nodejs";

function appBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function GET(req: Request) {
  const result = (status: string) =>
    NextResponse.redirect(`${appBase()}/account/integrations?etsy=${status}`);

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

  const jar = await cookies();
  const savedState = jar.get("etsy_oauth_state")?.value;
  const codeVerifier = jar.get("etsy_oauth_pkce")?.value;
  if (!state || !savedState || state !== savedState || !codeVerifier) {
    return result("badstate");
  }

  try {
    const tok = await exchangeEtsyCode({ code, codeVerifier });
    const me = await getEtsyMe(tok.accessToken);
    const shop = await getEtsyShop(tok.accessToken, me.userId);
    await saveIntegration({
      uid: auth.user.userId,
      platform: "etsy",
      accessToken: tok.accessToken,
      refreshToken: tok.refreshToken,
      expiresInSec: tok.expiresInSec,
      scopes: tok.scope,
      accountId: shop ? String(shop.shopId) : String(me.userId),
      accountHandle: shop?.shopName ?? null,
    });
    const res = result(shop ? "connected" : "noshop");
    res.cookies.delete("etsy_oauth_state");
    res.cookies.delete("etsy_oauth_pkce");
    return res;
  } catch {
    return result("error");
  }
}
