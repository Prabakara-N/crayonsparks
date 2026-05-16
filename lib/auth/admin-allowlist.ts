import "server-only";

/**
 * Source of truth for who can access /admin/*.
 *
 * Set ADMIN_EMAILS in .env.local — comma-separated list, e.g.
 *   ADMIN_EMAILS=you@example.com,cofounder@example.com
 *
 * Case-insensitive. No restart needed in dev — env reload picks up changes.
 */
export function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().has(email.toLowerCase());
}
