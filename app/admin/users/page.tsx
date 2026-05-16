import type { Metadata } from "next";
import { UsersMain } from "@/components/admin/users/users-main";

export const metadata: Metadata = { title: "Admin · Users" };

export default function AdminUsersPage() {
  return <UsersMain />;
}
