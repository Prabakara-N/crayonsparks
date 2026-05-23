import type { Metadata } from "next";
import { FeedbackDetailMain } from "@/components/admin/feedback/feedback-detail-main";

export const metadata: Metadata = { title: "Admin · Feedback detail" };

interface AdminFeedbackDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminFeedbackDetailPage({
  params,
}: AdminFeedbackDetailPageProps) {
  const { id } = await params;
  return <FeedbackDetailMain id={id} />;
}
