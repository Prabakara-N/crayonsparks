import { cookies } from "next/headers";

export const runtime = "nodejs";

const COOKIE_NAME = "fb_id_token";

/**
 * Syncs the Firebase ID token into an httpOnly cookie so server routes
 * (e.g. /api/generate) can authenticate the caller without the browser
 * attaching an Authorization header to every fetch.
 *
 * The client (AuthProvider) POSTs here whenever the ID token changes
 * (sign-in + hourly refresh) and DELETEs on sign-out.
 */
export async function POST(req: Request) {
  let idToken: unknown;
  try {
    ({ idToken } = (await req.json()) as { idToken?: unknown });
  } catch {
    return new Response("Invalid body", { status: 400 });
  }
  if (typeof idToken !== "string" || idToken.length < 20) {
    return new Response("Missing idToken", { status: 400 });
  }
  const jar = await cookies();
  jar.set(COOKIE_NAME, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Firebase ID tokens expire after ~1h; AuthProvider re-POSTs on refresh.
    maxAge: 60 * 60,
  });
  return new Response(null, { status: 204 });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  return new Response(null, { status: 204 });
}
