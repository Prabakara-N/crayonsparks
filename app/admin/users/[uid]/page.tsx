import type { Metadata } from "next";
import { UserDetailMain } from "@/components/admin/users/user-detail-main";

export const metadata: Metadata = { title: "Admin · User" };

interface PageProps {
  params: Promise<{ uid: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { uid } = await params;
  return <UserDetailMain uid={uid} />;
}
