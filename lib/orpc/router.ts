import "server-only";

import { authRouter } from "./routers/auth";
import { adminRouter } from "./routers/admin";
import { booksRouter } from "./routers/books";
import { imagesRouter } from "./routers/images";
import { creditsRouter } from "./routers/credits";
import { billingRouter } from "./routers/billing";

export const router = {
  auth: authRouter,
  admin: adminRouter,
  books: booksRouter,
  images: imagesRouter,
  credits: creditsRouter,
  billing: billingRouter,
};

export type AppRouter = typeof router;
