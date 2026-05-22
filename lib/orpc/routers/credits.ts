import "server-only";

import { z } from "zod";
import {
  getCreditBalance,
  listCreditLedger,
} from "@/lib/firebase/credits";
import { protectedProcedure } from "../base";

const LedgerInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
});

export const creditsRouter = {
  balance: protectedProcedure.handler(async ({ context }) => {
    const balance = await getCreditBalance(context.userId as string);
    return { balance };
  }),

  ledger: protectedProcedure
    .input(LedgerInput)
    .handler(async ({ input, context }) => {
      const [balance, entries] = await Promise.all([
        getCreditBalance(context.userId as string),
        listCreditLedger(context.userId as string, input.limit),
      ]);
      return { balance, entries };
    }),
};
