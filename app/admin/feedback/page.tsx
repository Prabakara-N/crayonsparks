import type { Metadata } from "next";
import { FeedbackMain } from "@/components/admin/feedback/feedback-main";

export const metadata: Metadata = { title: "Admin · Feedback" };

export default function AdminFeedbackPage() {
  return <FeedbackMain />;
}
