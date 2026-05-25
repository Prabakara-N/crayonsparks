import "server-only";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";

interface RateLimitOk {
  ok: true;
  remaining: number;
  ip: string;
}

interface RateLimitFail {
  ok: false;
  response: Response;
}

interface RateLimitArgs {
  req: Request;
  kind: string;
  limit: number;
  windowMs?: number;
}

export async function rateLimitByIp(
  args: RateLimitArgs,
): Promise<RateLimitOk | RateLimitFail> {
  const windowMs = args.windowMs ?? 60 * 60 * 1000;
  const ip = resolveIp(args.req);
  const bucket = Math.floor(Date.now() / windowMs);
  const docId = `${ip}__${args.kind}__${bucket}`;
  const ref = db.collection("rateLimits").doc(docId);

  try {
    const after = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = (snap.data()?.count as number | undefined) ?? 0;
      const next = current + 1;
      if (next > args.limit) {
        return { exceeded: true, count: current };
      }
      tx.set(
        ref,
        {
          count: FieldValue.increment(1),
          kind: args.kind,
          ip,
          bucket,
          expiresAt: new Date((bucket + 1) * windowMs),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return { exceeded: false, count: next };
    });

    if (after.exceeded) {
      const resetSec = Math.ceil(((bucket + 1) * windowMs - Date.now()) / 1000);
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: `Too many requests. Try again in ${formatRetry(resetSec)}.`,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.max(1, resetSec)),
            },
          },
        ),
      };
    }
    return {
      ok: true,
      remaining: Math.max(0, args.limit - after.count),
      ip,
    };
  } catch {
    // Fail-open: if Firestore is unavailable, don't block the user.
    return { ok: true, remaining: args.limit, ip };
  }
}

function resolveIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function formatRetry(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.ceil(seconds / 60)} minutes`;
}
