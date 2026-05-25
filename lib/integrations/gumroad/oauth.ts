import "server-only";

const GUMROAD_AUTHORIZE = "https://gumroad.com/oauth/authorize";
const GUMROAD_TOKEN = "https://api.gumroad.com/oauth/token";

/** Minimum scope to create/update products on the creator's behalf. */
const SCOPE = "edit_products";

function env(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not configured.`);
  }
  return value;
}

function appBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function gumroadRedirectUri(): string {
  return `${appBase()}/api/integrations/gumroad/callback`;
}

export function buildGumroadAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env("GUMROAD_CLIENT_ID"),
    redirect_uri: gumroadRedirectUri(),
    scope: SCOPE,
    response_type: "code",
    state,
  });
  return `${GUMROAD_AUTHORIZE}?${params.toString()}`;
}

export interface GumroadToken {
  accessToken: string;
  scope: string;
}

/** Exchanges the OAuth `code` for a long-lived Gumroad access token. */
export async function exchangeGumroadCode(
  code: string,
): Promise<GumroadToken> {
  const res = await fetch(GUMROAD_TOKEN, {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("GUMROAD_CLIENT_ID"),
      client_secret: env("GUMROAD_CLIENT_SECRET"),
      code,
      redirect_uri: gumroadRedirectUri(),
    }).toString(),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Gumroad token exchange failed (${res.status}): ${detail.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as {
    access_token?: string;
    scope?: string;
  };
  if (!json.access_token) {
    throw new Error("Gumroad did not return an access token.");
  }
  return { accessToken: json.access_token, scope: json.scope ?? SCOPE };
}
