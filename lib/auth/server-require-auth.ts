import "server-only";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken, type DecodedIdToken } from "@/lib/firebase/admin";

export interface ServerAuthSuccess {
  ok: true;
  user: { userId: string; email: string | null };
}

export interface ServerAuthFailure {
  ok: false;
  response: Response;
}

function unauthorized(message: string): ServerAuthFailure {
  return {
    ok: false,
    response: NextResponse.json({ error: message }, { status: 401 }),
  };
}

/**
 * Resolves a Firebase ID token from either:
 *   1. the `Authorization: Bearer <token>` header, OR
 *   2. the `fb_id_token` httpOnly cookie (set by /api/auth/session)
 * Verifies it and returns the user, or a 401 response.
 */
export async function requireAuth(
  req: Request,
): Promise<ServerAuthSuccess | ServerAuthFailure> {
  let token: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice("Bearer ".length).trim() || null;
  }

  if (!token) {
    const cookie = (await cookies()).get("fb_id_token");
    token = cookie?.value || null;
  }

  if (!token) {
    return unauthorized("You must be signed in to use this feature.");
  }

  try {
    const decoded: DecodedIdToken = await verifyIdToken(token);
    return {
      ok: true,
      user: { userId: decoded.uid, email: decoded.email ?? null },
    };
  } catch {
    return unauthorized("Your session has expired. Please sign in again.");
  }
}
