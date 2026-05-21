import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/storage/r2";
import { requireAuth } from "@/lib/auth/server-require-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Same-origin proxy for R2 objects. The browser can't `fetch()` a
 * presigned R2 URL directly (cross-origin → CORS blocked), so the
 * saved-book download flow fetches through here instead.
 *
 * GET /api/storage/object?key=users/{uid}/books/{bookId}/...
 *   - Requires a valid Firebase ID token (Authorization: Bearer …)
 *   - Only serves keys under the caller's own users/{uid}/ prefix
 */
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const key = new URL(req.url).searchParams.get("key");
  if (!key) {
    return new Response("Missing key", { status: 400 });
  }
  if (!key.startsWith(`users/${auth.user.userId}/`)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const obj = await r2.send(
      new GetObjectCommand({ Bucket: R2_BUCKET(), Key: key }),
    );
    if (!obj.Body) {
      return new Response("Not found", { status: 404 });
    }
    const bytes = await obj.Body.transformToByteArray();
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": obj.ContentType ?? "image/png",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
