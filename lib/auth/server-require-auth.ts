import "server-only";

import { NextResponse } from "next/server";
import { verifyIdToken, type DecodedIdToken } from "@/lib/firebase/admin";

export interface ServerAuthSuccess {
  ok: true;
  user: { userId: string; email: string | null };
}

export interface ServerAuthFailure {
  ok: false;
  response: Response;
}

export async function requireAuth(
  req: Request,
): Promise<ServerAuthSuccess | ServerAuthFailure> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You must be signed in to use this feature." },
        { status: 401 },
      ),
    };
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You must be signed in to use this feature." },
        { status: 401 },
      ),
    };
  }
  try {
    const decoded: DecodedIdToken = await verifyIdToken(token);
    return {
      ok: true,
      user: { userId: decoded.uid, email: decoded.email ?? null },
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Your session has expired. Please sign in again." },
        { status: 401 },
      ),
    };
  }
}
