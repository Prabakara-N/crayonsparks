import "server-only";

import { notFound, redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { verifyIdToken } from "@/lib/firebase/admin";
import { isAdminEmail } from "./admin-allowlist";

interface AdminUser {
  uid: string;
  email: string;
}

async function readIdToken(): Promise<string | null> {
  const hdr = (await headers()).get("authorization");
  if (hdr?.startsWith("Bearer ")) {
    const token = hdr.slice("Bearer ".length).trim();
    if (token) return token;
  }
  const c = (await cookies()).get("firebase-id-token");
  if (c?.value) return c.value;
  return null;
}

/**
 * Page-level guard for /admin/* routes (used in app/admin/layout.tsx).
 *
 * Behavior:
 *   - Signed-out caller → redirect to /login?next=/admin
 *   - Signed-in but not in ADMIN_EMAILS → notFound() (404, no leak)
 *   - Signed-in admin → returns { uid, email }
 *
 * Note: client-side guard also wraps the shell as a defense-in-depth
 * because reading Firebase ID tokens server-side requires a cookie or
 * Authorization header. Until we wire token-cookie persistence, this
 * server guard primarily protects from URL-typing attempts and the
 * client guard handles the real flow.
 */
export async function requireAdminUser(): Promise<AdminUser> {
  const token = await readIdToken();
  if (!token) {
    redirect("/login?next=/admin");
  }
  try {
    const decoded = await verifyIdToken(token);
    const email = decoded.email ?? null;
    if (!isAdminEmail(email)) {
      notFound();
    }
    return { uid: decoded.uid, email: email as string };
  } catch {
    redirect("/login?next=/admin");
  }
}
