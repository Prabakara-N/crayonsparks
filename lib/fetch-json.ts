/**
 * Reads a fetch Response as JSON, but if the body is NOT json (e.g. Vercel
 * returned "An error occurred…" or "Request Entity Too Large") it throws a
 * clean Error("…(status)") instead of the cryptic
 * `SyntaxError: Unexpected token 'A', "An error o"…`.
 */
export async function readJsonOrThrow<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = /\bapplication\/json\b/i.test(contentType);

  let text = "";
  try {
    text = await res.text();
  } catch {
    text = "";
  }

  if (!isJson) {
    if (res.status === 413) {
      throw new Error(
        "Request was too large for the server (413). Try smaller reference images or fewer pages at once.",
      );
    }
    if (res.status >= 500) {
      throw new Error(
        `Server error (${res.status}). ${truncate(text, 160)}`.trim(),
      );
    }
    throw new Error(
      `Unexpected non-JSON response (${res.status}). ${truncate(text, 160)}`.trim(),
    );
  }

  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON from server (${res.status}).`);
  }

  if (!res.ok) {
    const message =
      (json as { error?: string } | null)?.error ??
      `Request failed (${res.status}).`;
    throw new Error(message);
  }

  return json as T;
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}…`;
}
