import "server-only";

import { authRouter } from "./routers/auth";
import { adminRouter } from "./routers/admin";
import { booksRouter } from "./routers/books";
import { imagesRouter } from "./routers/images";

export const router = {
  auth: authRouter,
  admin: adminRouter,
  books: booksRouter,
  images: imagesRouter,
};

export type AppRouter = typeof router;
