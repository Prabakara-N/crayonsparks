import type { Metadata } from "next";
import { AuditMain } from "@/components/admin/audit/audit-main";

export const metadata: Metadata = { title: "Admin · Audit log" };

export default function AdminAuditPage() {
  return <AuditMain />;
}
