import "server-only";

import { authRouter } from "./routers/auth";
import { adminRouter } from "./routers/admin";
import { booksRouter } from "./routers/books";
import { imagesRouter } from "./routers/images";
import { creditsRouter } from "./routers/credits";
import { billingRouter } from "./routers/billing";
import { integrationsRouter } from "./routers/integrations";

export const router = {
  auth: authRouter,
  admin: adminRouter,
  books: booksRouter,
  images: imagesRouter,
  credits: creditsRouter,
  billing: billingRouter,
  integrations: integrationsRouter,
};

export type AppRouter = typeof router;
