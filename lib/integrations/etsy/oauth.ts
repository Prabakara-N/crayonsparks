import "server-only";

import crypto from "node:crypto";

const ETSY_AUTHORIZE = "https://www.etsy.com/oauth/connect";
const ETSY_TOKEN = "https://api.etsy.com/v3/public/oauth/token";

const SCOPES = ["listings_r", "listings_w", "shops_r"];

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

export function etsyRedirectUri(): string {
  return `${appBase()}/api/integrations/etsy/callback`;
}

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
}

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function generatePkcePair(): PkcePair {
  const codeVerifier = base64url(crypto.randomBytes(48));
  const codeChallenge = base64url(
    crypto.createHash("sha256").update(codeVerifier).digest(),
  );
  return { codeVerifier, codeChallenge };
}

export function buildEtsyAuthorizeUrl(
  state: string,
  codeChallenge: string,
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env("ETSY_CLIENT_ID"),
    redirect_uri: etsyRedirectUri(),
    scope: SCOPES.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${ETSY_AUTHORIZE}?${params.toString()}`;
}

export interface EtsyToken {
  accessToken: string;
  refreshToken: string | null;
  scope: string;
  expiresInSec: number;
}

export async function exchangeEtsyCode(opts: {
  code: string;
  codeVerifier: string;
}): Promise<EtsyToken> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: env("ETSY_CLIENT_ID"),
    redirect_uri: etsyRedirectUri(),
    code: opts.code,
    code_verifier: opts.codeVerifier,
  });

  const res = await fetch(ETSY_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Etsy token exchange failed (${res.status}): ${detail.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    expires_in?: number;
  };
  if (!json.access_token) {
    throw new Error("Etsy did not return an access token.");
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    scope: json.scope ?? SCOPES.join(" "),
    expiresInSec: json.expires_in ?? 3600,
  };
}

export async function refreshEtsyToken(
  refreshToken: string,
): Promise<EtsyToken> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: env("ETSY_CLIENT_ID"),
    refresh_token: refreshToken,
  });

  const res = await fetch(ETSY_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Etsy token refresh failed (${res.status}): ${detail.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    expires_in?: number;
  };
  if (!json.access_token) {
    throw new Error("Etsy refresh did not return a new access token.");
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    scope: json.scope ?? SCOPES.join(" "),
    expiresInSec: json.expires_in ?? 3600,
  };
}
