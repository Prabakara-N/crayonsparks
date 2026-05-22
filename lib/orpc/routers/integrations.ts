import "server-only";

import { z } from "zod";
import {
  listIntegrationStatus,
  deleteIntegration,
} from "@/lib/integrations/common/token-store";
import { protectedProcedure } from "../base";

const DisconnectInput = z.object({
  platform: z.enum(["gumroad", "pinterest", "etsy"]),
});

export const integrationsRouter = {
  status: protectedProcedure.handler(async ({ context }) => {
    const items = await listIntegrationStatus(context.userId as string);
    return { items };
  }),

  disconnect: protectedProcedure
    .input(DisconnectInput)
    .handler(async ({ input, context }) => {
      await deleteIntegration(context.userId as string, input.platform);
      return { ok: true };
    }),
};
