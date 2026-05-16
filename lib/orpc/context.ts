import "server-only";

import { verifyIdToken } from "@/lib/firebase/admin";

export interface OrpcContext {
  userId: string | null;
  email: string | null;
}

export async function buildContext(req: Request): Promise<OrpcContext> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { userId: null, email: null };
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return { userId: null, email: null };
  try {
    const decoded = await verifyIdToken(token);
    return {
      userId: decoded.uid,
      email: decoded.email ?? null,
    };
  } catch {
    return { userId: null, email: null };
  }
}
