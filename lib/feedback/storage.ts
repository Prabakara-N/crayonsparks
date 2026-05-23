import "server-only";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/storage/r2";

interface UploadScreenshotArgs {
  feedbackId: string;
  userId: string;
  base64: string;
}

export async function uploadFeedbackScreenshot(
  args: UploadScreenshotArgs,
): Promise<{ key: string }> {
  const cleaned = args.base64.startsWith("data:")
    ? args.base64.slice(args.base64.indexOf(",") + 1)
    : args.base64;
  const buffer = Buffer.from(cleaned, "base64");
  const mime = /^data:(image\/[a-z0-9.+-]+)/i.exec(args.base64)?.[1];
  const ext =
    mime === "image/png"
      ? "png"
      : mime === "image/jpeg" || mime === "image/jpg"
        ? "jpg"
        : mime === "image/webp"
          ? "webp"
          : "png";
  const key = `feedback/${args.userId}/${args.feedbackId}.${ext}`;
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET(),
      Key: key,
      Body: buffer,
      ContentType: mime ?? "image/png",
    }),
  );
  return { key };
}
