import "server-only";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-require-auth";
import {
  deductCredits,
  getCreditBalance,
} from "@/lib/firebase/credits";
import { creditCost, type BookKind, type GenOp } from "./costs";

interface ChargeOk {
  ok: true;
  userId: string;
  cost: number;
  /**
   * Deduct the credits — call ONLY after the generation succeeded so
   * users are never charged for failed renders. Fails open (logs, never
   * throws) so a ledger hiccup can't break a successful generation.
   */
  commit: (label: string) => Promise<void>;
}

interface ChargeFail {
  ok: false;
  response: Response;
}

/**
 * Pre-flight credit gate for a generation endpoint:
 *   1. Authenticates the caller (header or session cookie)
 *   2. Computes the credit cost for { kind, op }
 *   3. Rejects with 402 if the balance is too low
 *   4. Returns a `commit()` to deduct AFTER the generation succeeds
 *
 * Usage:
 *   const charge = await preauthorizeCharge(req, { kind: "coloring", op: "page" });
 *   if (!charge.ok) return charge.response;
 *   ... generate ...
 *   await charge.commit("Coloring page");
 */
export async function preauthorizeCharge(
  req: Request,
  opts: { kind: BookKind; op: GenOp; label?: string },
): Promise<ChargeOk | ChargeFail> {
  const auth = await requireAuth(req);
  if (!auth.ok) return { ok: false, response: auth.response };

  const cost = creditCost(opts.kind, opts.op);
  const balance = await getCreditBalance(auth.user.userId);

  if (balance < cost) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Not enough credits — this needs ${cost}, you have ${balance}. Top up in Billing.`,
          code: "INSUFFICIENT_CREDITS",
          cost,
          balance,
        },
        { status: 402 },
      ),
    };
  }

  const userId = auth.user.userId;
  return {
    ok: true,
    userId,
    cost,
    commit: async (label: string) => {
      try {
        await deductCredits(userId, cost, label);
      } catch {
        // Fail open: the user already received the generation. A failed
        // ledger write must not surface as a generation error.
      }
    },
  };
}
