import "server-only";

import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { uploadFeedbackScreenshot } from "@/lib/feedback/storage";
import { FEEDBACK_KINDS } from "@/lib/feedback/types";
import { sendFeedbackEmail } from "@/lib/email/send-feedback-email";
import { sendFeedbackConfirmationEmail } from "@/lib/email/send-feedback-confirmation-email";
import {
  getSurveyState,
  markSurveyCompleted,
  markSurveyShown,
  markSurveySkipped,
} from "@/lib/firebase/feedback-survey";
import { protectedProcedure } from "../base";

const SubmitInput = z.object({
  kind: z.enum(FEEDBACK_KINDS),
  title: z.string().trim().min(3).max(140),
  body: z.string().trim().min(3).max(4000),
  page: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
  screenshotBase64: z.string().min(100).optional(),
  source: z.enum(["widget", "post-book-survey"]).optional(),
  bookKind: z.enum(["coloring", "story"]).optional(),
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
      const source = input.source ?? "widget";
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
        source,
        bookKind: input.bookKind ?? null,
        createdAt: now,
        updatedAt: now,
        respondedAt: null,
      });

      sendFeedbackEmail({
        feedbackId: docRef.id,
        kind: input.kind,
        title: input.title,
        body: input.body,
        userEmail,
        userId,
        page: input.page ?? null,
        source,
        bookKind: input.bookKind,
      }).then((result) => {
        if (!result.ok) {
          console.warn("[feedback] admin email send failed:", result.error);
        }
      });

      if (userEmail) {
        let displayName: string | null = null;
        try {
          const userDoc = await db.collection("users").doc(userId).get();
          const data = userDoc.data();
          displayName = (data?.displayName as string | undefined) ?? null;
        } catch {
          // non-fatal — confirmation just uses generic greeting
        }
        sendFeedbackConfirmationEmail({
          to: userEmail,
          recipientName: displayName,
          feedbackId: docRef.id,
          kind: input.kind,
          title: input.title,
          body: input.body,
        }).then((result) => {
          if (!result.ok) {
            console.warn(
              "[feedback] confirmation email send failed:",
              result.error,
            );
          }
        });
      }

      if (source === "post-book-survey" && input.bookKind) {
        await markSurveyCompleted(userId, input.bookKind);
      }

      return { id: docRef.id };
    }),

  getSurveyState: protectedProcedure
    .input(z.object({ kind: z.enum(["coloring", "story"]) }))
    .handler(async ({ input, context }) => {
      const userId = context.userId as string;
      return getSurveyState(userId, input.kind);
    }),

  markSurveyShown: protectedProcedure
    .input(z.object({ kind: z.enum(["coloring", "story"]) }))
    .handler(async ({ input, context }) => {
      const userId = context.userId as string;
      await markSurveyShown(userId, input.kind);
      return { ok: true };
    }),

  skipSurvey: protectedProcedure
    .input(z.object({ kind: z.enum(["coloring", "story"]) }))
    .handler(async ({ input, context }) => {
      const userId = context.userId as string;
      return markSurveySkipped(userId, input.kind);
    }),
};
