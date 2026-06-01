import "server-only";

import { z } from "zod";
import { uploadImageVariantsFromBase64 } from "@/lib/storage/upload-image";
import { protectedProcedure } from "../base";

const BookRole = z.union([
  z.literal("cover"),
  z.literal("back-cover"),
  z.literal("belongs-to"),
  z.literal("the-end"),
  z.string().regex(/^page-[a-zA-Z0-9_-]+$/, "Invalid page role"),
  z.string().regex(/^activity-page-[a-zA-Z0-9_.-]+$/, "Invalid activity page role"),
  z.string().regex(/^activity-solution-[a-zA-Z0-9_.-]+$/, "Invalid activity solution role"),
]);

const UploadInput = z.object({
  bookId: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, "Invalid bookId"),
  role: BookRole,
  base64: z.string().min(100),
});

export const imagesRouter = {
  upload: protectedProcedure
    .input(UploadInput)
    .handler(async ({ input, context }) => {
      const keyPrefix = `users/${context.userId}/books/${input.bookId}/${input.role}`;
      const variants = await uploadImageVariantsFromBase64({
        keyPrefix,
        base64: input.base64,
      });
      return variants;
    }),
};
