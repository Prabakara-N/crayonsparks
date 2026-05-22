import "server-only";

const GUMROAD_API = "https://api.gumroad.com/v2";

export interface GumroadUser {
  userId: string;
  name: string | null;
}

/**
 * Fetches the connected Gumroad account — used to verify a freshly
 * exchanged token and capture the creator's handle for display.
 */
export async function getGumroadUser(
  accessToken: string,
): Promise<GumroadUser> {
  const res = await fetch(
    `${GUMROAD_API}/user?access_token=${encodeURIComponent(accessToken)}`,
  );
  if (!res.ok) {
    throw new Error(`Gumroad /user failed (${res.status}).`);
  }
  const json = (await res.json()) as {
    success?: boolean;
    user?: { user_id?: string; name?: string };
  };
  if (!json.success || !json.user) {
    throw new Error("Gumroad rejected the access token.");
  }
  return {
    userId: json.user.user_id ?? "",
    name: json.user.name ?? null,
  };
}
