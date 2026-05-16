import "server-only";

import { authRouter } from "./routers/auth";

export const router = {
  auth: authRouter,
};

export type AppRouter = typeof router;
