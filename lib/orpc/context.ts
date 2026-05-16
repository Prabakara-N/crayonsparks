import "server-only";

import { verifyIdToken } from "@/lib/firebase/admin";
import { isAdminEmail } from "@/lib/auth/admin-allowlist";

export interface OrpcContext {
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
}

const EMPTY: OrpcContext = {
  userId: null,
  email: null,
  isAdmin: false,
};

export async function buildContext(req: Request): Promise<OrpcContext> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return EMPTY;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return EMPTY;
  try {
    const decoded = await verifyIdToken(token);
    const email = decoded.email ?? null;
    return {
      userId: decoded.uid,
      email,
      isAdmin: isAdminEmail(email),
    };
  } catch {
    return EMPTY;
  }
}
