import "server-only";

import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { uploadFeedbackScreenshot } from "@/lib/feedback/storage";
import { FEEDBACK_KINDS } from "@/lib/feedback/types";
import { protectedProcedure } from "../base";

const SubmitInput = z.object({
  kind: z.enum(FEEDBACK_KINDS),
  title: z.string().trim().min(3).max(140),
  body: z.string().trim().min(3).max(4000),
  page: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
  screenshotBase64: z.string().min(100).optional(),
});

export const feedbackRouter = {
  submit: protectedProcedure
    .input(SubmitInput)
    .handler(async ({ input, context }) => {
      const userId = context.userId as string;
      const userEmail = context.email ?? null;

      const docRef = db.collection("feedback").doc();
      let screenshotKey: string | null = null;

      if (input.screenshotBase64) {
        const result = await uploadFeedbackScreenshot({
          feedbackId: docRef.id,
          userId,
          base64: input.screenshotBase64,
        });
        screenshotKey = result.key;
      }

      const now = FieldValue.serverTimestamp();
      await docRef.set({
        id: docRef.id,
        userId,
        userEmail,
        kind: input.kind,
        title: input.title,
        body: input.body,
        page: input.page ?? null,
        userAgent: input.userAgent ?? null,
        screenshotKey,
        status: "open",
        adminNotes: "",
        createdAt: now,
        updatedAt: now,
        respondedAt: null,
      });

      return { id: docRef.id };
    }),
};
