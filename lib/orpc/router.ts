import "server-only";

import { authRouter } from "./routers/auth";
import { adminRouter } from "./routers/admin";

export const router = {
  auth: authRouter,
  admin: adminRouter,
};

export type AppRouter = typeof router;
