import "server-only";

import { NextResponse } from "next/server";

const DEFAULT_MAX_BYTES = 4 * 1024 * 1024;

interface BoundedOk<T> {
  ok: true;
  body: T;
}

interface BoundedFail {
  ok: false;
  response: Response;
}

/**
 * Reads the request body as JSON only if Content-Length is present and below
 * the allowed cap (default 4MB to stay under Vercel Hobby's 4.5MB edge limit).
 * Returns a clean 413 JSON response with a usable message when too large.
 * Returns 400 when the body is missing / malformed.
 */
export async function readBoundedJson<T>(
  req: Request,
  maxBytes: number = DEFAULT_MAX_BYTES,
): Promise<BoundedOk<T> | BoundedFail> {
  const lengthHeader = req.headers.get("content-length");
  if (lengthHeader !== null) {
    const length = Number(lengthHeader);
    if (Number.isFinite(length) && length > maxBytes) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: `Request body is too large (${formatBytes(length)}). Reduce reference image sizes or send fewer images per call. Limit is ${formatBytes(maxBytes)}.`,
          },
          { status: 413 },
        ),
      };
    }
  }

  let body: T;
  try {
    body = (await req.json()) as T;
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Request body is not valid JSON." },
        { status: 400 },
      ),
    };
  }

  return { ok: true, body };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
