import "server-only";

const PINTEREST_AUTHORIZE = "https://www.pinterest.com/oauth/";
const PINTEREST_TOKEN = "https://api.pinterest.com/v5/oauth/token";

const SCOPES = [
  "boards:read",
  "boards:write",
  "pins:read",
  "pins:write",
  "user_accounts:read",
].join(",");

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

export function pinterestRedirectUri(): string {
  return `${appBase()}/api/integrations/pinterest/callback`;
}

export function buildPinterestAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env("PINTEREST_CLIENT_ID"),
    redirect_uri: pinterestRedirectUri(),
    scope: SCOPES,
    state,
  });
  return `${PINTEREST_AUTHORIZE}?${params.toString()}`;
}

export interface PinterestToken {
  accessToken: string;
  refreshToken: string | null;
  scope: string;
  expiresInSec: number;
}

/** Exchanges the OAuth `code` for a Pinterest access token (Basic auth). */
export async function exchangePinterestCode(
  code: string,
): Promise<PinterestToken> {
  const basic = Buffer.from(
    `${env("PINTEREST_CLIENT_ID")}:${env("PINTEREST_CLIENT_SECRET")}`,
  ).toString("base64");

  const res = await fetch(PINTEREST_TOKEN, {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: pinterestRedirectUri(),
    }).toString(),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Pinterest token exchange failed (${res.status}): ${detail.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    expires_in?: number;
  };
  if (!json.access_token) {
    throw new Error("Pinterest did not return an access token.");
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    scope: json.scope ?? SCOPES,
    expiresInSec: json.expires_in ?? 0,
  };
}
